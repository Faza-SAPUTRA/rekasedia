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
    const { rows } = await pool.query(`
      SELECT r.*, 
             i.name AS item_name, 
             i.unit AS unit,
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
    const { items } = req.body;
    // items = [{ item_id, quantity }]

    // Guru hanya boleh mengajukan atas namanya sendiri; admin boleh atas nama siapa pun.
    const requester_id = req.user?.role === 'admin'
      ? (req.body.requester_id || req.user?.id)
      : req.user?.id;

    if (!items || items.length === 0 || !requester_id) {
      return res.status(400).json({ error: 'Data permintaan tidak valid.' });
    }

    const results = [];
    const notifItems = [];

    for (const item of items) {
      const priority = String(item.priority || req.body.priority || 'REGULER').toUpperCase() === 'URGENT' ? 'URGENT' : 'REGULER';

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
        `INSERT INTO requests (req_code, item_id, requester_id, quantity, request_date, status, priority)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, 'PENDING', $5) RETURNING id`,
        [req_code, item.item_id, requester_id, item.quantity, priority]
      );

      results.push({ id: result.rows[0].id, req_code });

      // Audit log — actor info dari JWT middleware
      logAudit({
        actorId: req.user?.id || requester_id,
        actorRole: req.user?.role || 'guru',
        actionType: 'INSERT',
        tableAffected: 'requests',
        recordId: result.rows[0].id,
        changeDetails: { req_code, item_id: item.item_id, quantity: item.quantity },
        ipAddress: req.ip,
      });

      // Kumpulkan data untuk notifikasi Telegram
      const { rows: itemInfo } = await pool.query('SELECT name FROM items WHERE id = $1', [item.item_id]);
      if (itemInfo.length > 0) {
        notifItems.push({ item_name: itemInfo[0].name, quantity: item.quantity });
      }
    }

    // Telegram: Notifikasi ke Admin tentang permintaan baru
    const requesterName = req.user?.full_name || 'Guru';
    notifyNewRequest(requesterName, notifItems);

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

    await client.query('BEGIN');
    await setRLSContext(client, req.user);
    if (status === 'COMPLETED') {
      await ensureCompletedStatusSupport(client);
    }

    const { rows } = await client.query(
      `SELECT r.id, r.item_id, r.quantity, r.status, r.req_code, r.requester_id,
              i.name AS item_name,
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

    if (status === 'COMPLETED') {
      if (request.status !== 'APPROVED') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Hanya permintaan siap diambil yang dapat diselesaikan.' });
      }

      await client.query(
        "UPDATE requests SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1",
        [req.params.id]
      );
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
      notifyRequestApproved(requesterTeacher, request.req_code, request.item_name, request.quantity);
    } else if (status === 'REJECTED') {
      notifyRequestRejected(requesterTeacher, request.req_code, request.item_name);
    }

    const messages = {
      APPROVED: 'Permintaan berhasil disetujui.',
      REJECTED: 'Permintaan berhasil ditolak.',
      COMPLETED: 'Barang berhasil ditandai sudah diambil.',
    };
    res.json({ message: messages[status] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Gagal mengupdate permintaan.' });
  } finally {
    client.release();
  }
});

export default router;
