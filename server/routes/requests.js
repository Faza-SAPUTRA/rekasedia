import { Router } from 'express';
import pool, { setRLSContext } from '../db.js';
import { logAudit } from '../services/auditLogger.js';
import {
  notifyNewRequest,
  notifyRequestApproved,
  notifyRequestRejected,
} from '../services/telegram.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

let completedStatusReady;
let scheduleSchemaReady;

async function ensureScheduleSchema(queryable = pool) {
  if (!scheduleSchemaReady) {
    scheduleSchemaReady = (async () => {
      await queryable.query(`
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS borrow_date DATE DEFAULT NULL;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;
        ALTER TABLE loans ADD COLUMN IF NOT EXISTS request_id INT DEFAULT NULL;
        ALTER TABLE loans ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
      `);
    })().catch((error) => {
      scheduleSchemaReady = undefined;
      throw error;
    });
  }
  return scheduleSchemaReady;
}

async function ensureCompletedStatusSupport(client) {
  if (!completedStatusReady) {
    completedStatusReady = (async () => {
      await client.query('SAVEPOINT completed_status_migration');
      try {
        await client.query('ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check');
        await client.query(`
          ALTER TABLE requests
          ADD CONSTRAINT requests_status_check
          CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
        `);
        await client.query('ALTER TABLE requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NULL');
        await client.query('RELEASE SAVEPOINT completed_status_migration');
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT completed_status_migration');
        throw error;
      }
    })().catch((error) => {
      completedStatusReady = undefined;
      throw error;
    });
  }

  return completedStatusReady;
}

// GET /api/requests — Semua permintaan + nama barang & pemohon
router.get('/', async (req, res) => {
  try {
    await ensureScheduleSchema();
    const { rows } = await pool.query(`
      SELECT r.*, 
             i.name AS item_name, 
             i.unit AS unit,
             i.is_loanable AS is_loanable,
             i.description AS item_description,
             c.name AS category_name,
             u.full_name AS requester_name, 
             u.department AS requester_role
      FROM requests r
      JOIN items i ON r.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Gagal mengambil data permintaan.' });
  }
});

// POST /api/requests — Buat permintaan baru (dari Cart Teacher)
router.post('/', async (req, res) => {
  try {
    await ensureScheduleSchema();
    const { items, borrow_date, due_date, notes } = req.body;
    // items = [{ item_id, quantity }]

    // Guru hanya boleh mengajukan atas namanya sendiri; admin boleh atas nama siapa pun.
    const requester_id = req.user?.role === 'admin'
      ? (req.body.requester_id || req.user?.id)
      : req.user?.id;

    if (!items || items.length === 0 || !requester_id) {
      return res.status(400).json({ error: 'Data permintaan tidak valid.' });
    }

    const cleanBorrowDate = borrow_date ? String(borrow_date).trim() : null;
    const cleanDueDate = due_date ? String(due_date).trim() : null;
    const cleanNotes = notes ? String(notes).trim() : null;

    if ((cleanBorrowDate && !cleanDueDate) || (!cleanBorrowDate && cleanDueDate)) {
      return res.status(400).json({ error: 'Tanggal pinjam dan batas kembali harus diisi keduanya.' });
    }

    if (cleanBorrowDate && cleanDueDate && new Date(cleanBorrowDate) > new Date(cleanDueDate)) {
      return res.status(400).json({ error: 'Tanggal pinjam tidak boleh melebihi batas kembali.' });
    }

    const results = [];
    const notifItems = [];

    for (const item of items) {
      // Validasi quantity: harus integer positif, max 1000
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
        return res.status(400).json({ error: `Jumlah permintaan tidak valid (harus 1-1000). Diterima: ${item.quantity}` });
      }
      item.quantity = qty; // normalize

      // Cek info barang (nama & klasifikasi is_loanable)
      const { rows: itemInfo } = await pool.query('SELECT name, is_loanable FROM items WHERE id = $1', [item.item_id]);
      const isLoanable = Boolean(itemInfo[0]?.is_loanable);

      const priority = String(item.priority || req.body.priority || 'REGULER').toUpperCase() === 'URGENT' ? 'URGENT' : 'REGULER';
      // Jadwal pinjam/kembali hanya berlaku untuk Barang Modal (is_loanable = true).
      // Barang Persediaan cukup tracking status tanpa tanggal kembali.
      const itemBorrowDate = isLoanable
        ? (item.borrow_date ? String(item.borrow_date).trim() : cleanBorrowDate)
        : null;
      const itemDueDate = isLoanable
        ? (item.due_date ? String(item.due_date).trim() : cleanDueDate)
        : null;
      const itemNotes = item.notes ? String(item.notes).trim() : cleanNotes;

      // Generate req_code format REQ-YYYYMM-XXXX (urut per bulan)
      const { rows: seqRows } = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM requests
         WHERE to_char(request_date, 'YYYYMM') = to_char(CURRENT_DATE, 'YYYYMM')`
      );
      const period = await pool.query(`SELECT to_char(CURRENT_DATE, 'YYYYMM') AS period`);
      const nextNum = Number(seqRows[0]?.total || 0) + 1;
      const req_code = `REQ-${period.rows[0].period}-${String(nextNum).padStart(4, '0')}`;

      const result = await pool.query(
        `INSERT INTO requests (req_code, item_id, requester_id, quantity, request_date, status, priority, borrow_date, due_date, notes)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, 'PENDING', $5, $6, $7, $8) RETURNING id`,
        [req_code, item.item_id, requester_id, item.quantity, priority, itemBorrowDate, itemDueDate, itemNotes]
      );

      results.push({ id: result.rows[0].id, req_code });

      // Audit log — actor info dari JWT middleware
      logAudit({
        actorId: req.user?.id || requester_id,
        actorRole: req.user?.role || 'guru',
        actionType: 'INSERT',
        tableAffected: 'requests',
        recordId: result.rows[0].id,
        changeDetails: {
          req_code,
          item_id: item.item_id,
          quantity: item.quantity,
          ...(itemBorrowDate && itemDueDate ? { borrow_date: itemBorrowDate, due_date: itemDueDate } : {}),
        },
        ipAddress: req.ip,
      });

      // Kumpulkan data untuk notifikasi Telegram
      if (itemInfo.length > 0) {
        notifItems.push({ item_name: itemInfo[0].name, quantity: item.quantity });
      }
    }

    // Telegram: Notifikasi ke Admin tentang permintaan baru
    const requesterName = req.user?.full_name || 'Guru';
    await notifyNewRequest(
      requesterName,
      notifItems,
      cleanBorrowDate && cleanDueDate ? { borrow_date: cleanBorrowDate, due_date: cleanDueDate } : null
    ).catch((err) =>
      console.error('[Telegram] notifyNewRequest error:', err.message)
    );

    res.status(201).json({ message: 'Permintaan berhasil dikirim!', requests: results });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Gagal membuat permintaan.' });
  }
});

// PUT /api/requests/:id — Update status (Admin Approve/Reject)
router.put('/:id', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, reviewed_by } = req.body;

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Status permintaan tidak valid.' });
    }

    await ensureScheduleSchema();
    await client.query('BEGIN');
    await setRLSContext(client, req.user);
    if (status === 'COMPLETED') {
      await ensureCompletedStatusSupport(client);
    }

    const { rows } = await client.query(
      `SELECT r.id, r.item_id, r.quantity, r.status, r.req_code, r.requester_id,
              r.borrow_date, r.due_date, r.notes,
              i.name AS item_name,
              i.is_loanable AS is_loanable,
              u.full_name AS requester_name,
              to_jsonb(u)->>'telegram_username' AS requester_telegram_username,
              to_jsonb(u)->>'telegram_chat_id' AS requester_telegram_chat_id
       FROM requests r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.requester_id = u.id
       WHERE r.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const request = rows[0];

    if (!request) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Permintaan tidak ditemukan.' });
    }

    const oldStatus = request.status;
    let loanCreated = false;

    if (status === 'COMPLETED') {
      if (request.status !== 'APPROVED') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Hanya permintaan siap diambil yang dapat diselesaikan.' });
      }

      // Evidence photo is required for COMPLETED
      const { evidence_photo } = req.body;
      if (!evidence_photo) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Foto bukti pengambilan wajib dilampirkan.' });
      }

      // Ensure column exists
      await client.query('ALTER TABLE requests ADD COLUMN IF NOT EXISTS evidence_photo TEXT DEFAULT NULL');

      await client.query(
        "UPDATE requests SET status = 'COMPLETED', completed_at = NOW(), evidence_photo = $2 WHERE id = $1",
        [req.params.id, evidence_photo]
      );

      // Hanya Barang Modal (is_loanable = true) yang otomatis masuk ke tabel `loans`
      // agar memiliki batas pengembalian & wajib dikembalikan via Admin Sarpras.
      const shouldCreateLoan = Boolean(request.is_loanable);
      if (shouldCreateLoan) {
        const { rows: existingLoan } = await client.query(
          'SELECT id FROM loans WHERE request_id = $1 LIMIT 1',
          [request.id]
        );
        if (existingLoan.length === 0) {
          const { rows: insertedLoan } = await client.query(
            `INSERT INTO loans (item_id, borrower_id, borrow_date, due_date, status, condition_note, request_id, quantity)
             VALUES (
               $1,
               $2,
               COALESCE($3::date, CURRENT_DATE),
               COALESCE($4::date, CURRENT_DATE + INTERVAL '3 days'),
               'DIPINJAM',
               $5,
               $6,
               $7
             )
             RETURNING id`,
            [
              request.item_id,
              request.requester_id,
              request.borrow_date || null,
              request.due_date || null,
              request.notes || `Dari permintaan ${request.req_code}`,
              request.id,
              request.quantity || 1,
            ]
          );

          await logAudit({
            actorId: req.user?.id || reviewed_by,
            actorRole: req.user?.role || 'admin',
            actionType: 'INSERT',
            tableAffected: 'loans',
            recordId: insertedLoan[0].id,
            changeDetails: {
              from_request: request.req_code,
              item_name: request.item_name,
              quantity: request.quantity || 1,
              borrow_date: request.borrow_date || 'today',
              due_date: request.due_date || '+3 days',
            },
            ipAddress: req.ip,
            client,
          });
          loanCreated = true;
        }
      }
    } else {
      if (request.status !== 'PENDING') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Permintaan ini sudah diproses.' });
      }

      if (status === 'APPROVED') {
        const stockUpdate = await client.query(
          'UPDATE items SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1',
          [request.quantity, request.item_id]
        );
        if (stockUpdate.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Stok barang tidak mencukupi.' });
        }
      }

      await client.query(
        'UPDATE requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3',
        [status, reviewed_by || null, req.params.id]
      );
    }

    // Audit log — catat perubahan status
    await logAudit({
      actorId: req.user?.id || reviewed_by,
      actorRole: req.user?.role || 'admin',
      actionType: 'UPDATE',
      tableAffected: 'requests',
      recordId: parseInt(req.params.id),
      changeDetails: {
        req_code: request.req_code,
        old_status: oldStatus,
        new_status: status,
        item_name: request.item_name,
        quantity: request.quantity,
      },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    // Telegram: notifikasi guru pemohon — masuk ke grup guru dan di-tag
    const requesterTeacher = {
      fullName: request.requester_name,
      username: request.requester_telegram_username,
      chatId: request.requester_telegram_chat_id,
    };
    if (status === 'APPROVED') {
      await notifyRequestApproved(requesterTeacher, request.req_code, request.item_name, request.quantity).catch((err) =>
        console.error('[Telegram] notifyRequestApproved error:', err.message)
      );
    } else if (status === 'REJECTED') {
      await notifyRequestRejected(requesterTeacher, request.req_code, request.item_name).catch((err) =>
        console.error('[Telegram] notifyRequestRejected error:', err.message)
      );
    }

    const messages = {
      APPROVED: 'Permintaan berhasil disetujui.',
      REJECTED: 'Permintaan berhasil ditolak.',
      COMPLETED: loanCreated
        ? 'Barang sudah diambil dan otomatis tercatat di Peminjaman Aset.'
        : 'Barang berhasil ditandai sudah diambil.',
    };
    res.json({ message: messages[status], loan_created: loanCreated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Gagal mengupdate permintaan.' });
  } finally {
    client.release();
  }
});

export default router;
