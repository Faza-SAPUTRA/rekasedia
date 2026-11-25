import { Router } from 'express';
import pool, { setRLSContext } from '../db.js';
import { logAudit } from '../services/auditLogger.js';
import { notifyNewLoan, notifyLoanDueReminder, notifyOverdueLoans } from '../services/telegram.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

let loanColumnsReady;

async function ensureLoanColumns() {
  if (!loanColumnsReady) {
    loanColumnsReady = (async () => {
      await pool.query(`
        ALTER TABLE loans ADD COLUMN IF NOT EXISTS request_id INT DEFAULT NULL;
        ALTER TABLE loans ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
        ALTER TABLE loans ADD COLUMN IF NOT EXISTS return_evidence_photo TEXT DEFAULT NULL;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS evidence_photo TEXT DEFAULT NULL;
      `);
    })().catch((error) => {
      loanColumnsReady = undefined;
      throw error;
    });
  }
  return loanColumnsReady;
}

// GET /api/loans — Semua peminjaman + nama barang, peminjam & bukti foto
router.get('/', async (req, res) => {
  try {
    await ensureLoanColumns();
    const { rows } = await pool.query(`
      SELECT l.*, 
             i.name AS item_name,
             i.image_url AS item_image,
             u.full_name AS borrower_name,
             r.req_code AS req_code,
             r.evidence_photo AS pickup_evidence_photo
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      LEFT JOIN requests r ON l.request_id = r.id
      ORDER BY l.borrow_date DESC, l.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get loans error:', err);
    res.status(500).json({ error: 'Gagal mengambil data peminjaman.' });
  }
});

// GET /api/loans/availability?item_id=X — Cek jadwal yang sudah di-booking
router.get('/availability', async (req, res) => {
  try {
    const { item_id } = req.query;

    if (!item_id) {
      return res.status(400).json({ error: 'Parameter item_id wajib diisi.' });
    }

    // Ambil semua booking aktif (DIPINJAM) untuk item ini
    const { rows: activeBookings } = await pool.query(
      `SELECT id, borrow_date, due_date, borrower_id,
              (SELECT full_name FROM users WHERE id = l.borrower_id) AS borrower_name
       FROM loans l
       WHERE item_id = $1 AND status = 'DIPINJAM'
       ORDER BY borrow_date ASC`,
      [item_id]
    );

    // Ambil info stok item (berapa unit tersedia total)
    const { rows: itemInfo } = await pool.query(
      'SELECT id, name, stock, is_loanable FROM items WHERE id = $1',
      [item_id]
    );

    if (itemInfo.length === 0) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    res.json({
      item: itemInfo[0],
      active_bookings: activeBookings,
      total_active: activeBookings.length,
    });
  } catch (err) {
    console.error('Get loan availability error:', err);
    res.status(500).json({ error: 'Gagal mengecek ketersediaan.' });
  }
});

// POST /api/loans — Buat booking peminjaman baru (dengan validasi overlap)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { item_id, borrow_date, due_date, condition_note } = req.body;

    // Guru hanya boleh meminjam atas namanya sendiri; admin boleh atas nama siapa pun.
    const borrower_id = req.user?.role === 'admin'
      ? (req.body.borrower_id || req.user?.id)
      : req.user?.id;

    // Validasi input
    if (!item_id || !borrower_id || !borrow_date || !due_date) {
      return res.status(400).json({ error: 'Data peminjaman tidak lengkap. Wajib: item_id, borrow_date, due_date.' });
    }

    if (new Date(borrow_date) > new Date(due_date)) {
      return res.status(400).json({ error: 'Tanggal pinjam tidak boleh melebihi tanggal kembali.' });
    }

    await client.query('BEGIN');
    await setRLSContext(client, req.user);

    // Cek apakah item bisa dipinjam (is_loanable)
    const { rows: itemRows } = await client.query(
      'SELECT id, name, stock, is_loanable FROM items WHERE id = $1 FOR UPDATE',
      [item_id]
    );

    if (itemRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    const item = itemRows[0];
    if (!item.is_loanable) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Barang "${item.name}" bukan aset yang bisa dipinjam.` });
    }

    // === OVERLAPPING SCHEDULE VALIDATOR ===
    // Cek jumlah booking yang overlap dengan slot waktu yang diminta
    const { rows: overlapRows } = await client.query(
      `SELECT COUNT(*) AS overlap_count
       FROM loans
       WHERE item_id = $1
         AND status = 'DIPINJAM'
         AND borrow_date <= $3
         AND due_date >= $2`,
      [item_id, borrow_date, due_date]
    );

    const overlapCount = parseInt(overlapRows[0].overlap_count);

    // Jika jumlah booking yang overlap >= stok yang tersedia, tolak
    if (overlapCount >= item.stock) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Jadwal bentrok! Semua unit "${item.name}" sudah dibooking pada rentang tanggal tersebut.`,
        conflict_count: overlapCount,
        available_stock: item.stock,
      });
    }

    // Insert booking baru
    const { rows: newLoan } = await client.query(
      `INSERT INTO loans (item_id, borrower_id, borrow_date, due_date, status, condition_note)
       VALUES ($1, $2, $3, $4, 'DIPINJAM', $5) RETURNING id`,
      [item_id, borrower_id, borrow_date, due_date, condition_note || null]
    );

    // Audit log
    await logAudit({
      actorId: req.user?.id || borrower_id,
      actorRole: req.user?.role || 'guru',
      actionType: 'INSERT',
      tableAffected: 'loans',
      recordId: newLoan[0].id,
      changeDetails: {
        item_name: item.name,
        borrow_date,
        due_date,
      },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');

    // Telegram: Notifikasi ke Admin tentang peminjaman baru
    const borrowerName = req.user?.full_name || 'Guru';
    await notifyNewLoan(borrowerName, item.name, borrow_date, due_date).catch((err) =>
      console.error('[Telegram] notifyNewLoan error:', err.message)
    );

    res.status(201).json({
      message: `Peminjaman "${item.name}" berhasil dibuat.`,
      loan_id: newLoan[0].id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create loan error:', err);
    res.status(500).json({ error: 'Gagal membuat peminjaman.' });
  } finally {
    client.release();
  }
});

// PUT /api/loans/:id/return — Kembalikan barang (hanya Admin Sarpras + wajib bukti foto)
router.put('/:id/return', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureLoanColumns();
    const { return_evidence_photo } = req.body || {};

    if (!return_evidence_photo) {
      return res.status(400).json({ error: 'Foto bukti pengembalian wajib dilampirkan.' });
    }

    await client.query('BEGIN');
    await setRLSContext(client, req.user);

    const { rows } = await client.query(
      `SELECT l.*, i.name AS item_name
       FROM loans l
       JOIN items i ON l.item_id = i.id
       WHERE l.id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Data peminjaman tidak ditemukan.' });
    }

    const loan = rows[0];

    if (loan.status === 'DIKEMBALIKAN') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Barang sudah dikembalikan sebelumnya.' });
    }

    await client.query(
      "UPDATE loans SET status = 'DIKEMBALIKAN', return_date = CURRENT_DATE, return_evidence_photo = $2 WHERE id = $1",
      [req.params.id, return_evidence_photo]
    );

    // Jika peminjaman ini berasal dari permintaan yang mengurangi stok saat APPROVED,
    // kembalikan stok item ketika barang dikembalikan.
    if (loan.request_id) {
      const returnQty = Math.max(1, Number(loan.quantity || 1));
      await client.query(
        'UPDATE items SET stock = stock + $1, updated_at = NOW() WHERE id = $2',
        [returnQty, loan.item_id]
      );
    }

    // Audit log
    await logAudit({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actionType: 'UPDATE',
      tableAffected: 'loans',
      recordId: parseInt(req.params.id),
      changeDetails: {
        item_name: loan.item_name,
        old_status: 'DIPINJAM',
        new_status: 'DIKEMBALIKAN',
      },
      ipAddress: req.ip,
      client,
    });

    await client.query('COMMIT');
    res.json({ message: 'Barang berhasil dikembalikan.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Return loan error:', err);
    res.status(500).json({ error: 'Gagal mengembalikan barang.' });
  } finally {
    client.release();
  }
});

// GET /api/loans/overdue — Peminjaman yang belum dikembalikan (melewati due_date)
router.get('/overdue', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.id, l.item_id, l.borrower_id, l.borrow_date, l.due_date, l.status,
             i.name AS item_name,
             i.image_url AS item_image,
             u.full_name AS borrower_name,
             u.email AS borrower_email,
             (CURRENT_DATE - l.due_date::date) AS days_overdue
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      WHERE l.status = 'DIPINJAM'
        AND l.due_date < CURRENT_DATE
      ORDER BY l.due_date ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Get overdue loans error:', err);
    res.status(500).json({ error: 'Gagal mengambil data peminjaman terlambat.' });
  }
});

// POST /api/loans/overdue/notify — Kirim notifikasi overdue ke grup Telegram
router.post('/overdue/notify', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses hanya untuk admin.' });
    }

    const { rows } = await pool.query(`
      SELECT l.id, l.due_date,
             i.name AS item_name,
             u.full_name AS borrower_name,
             to_jsonb(u)->>'telegram_username' AS borrower_telegram_username,
             to_jsonb(u)->>'telegram_chat_id' AS borrower_telegram_chat_id,
             (CURRENT_DATE - l.due_date::date) AS days_overdue
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      WHERE l.status = 'DIPINJAM'
        AND l.due_date < CURRENT_DATE
      ORDER BY l.due_date ASC
    `);

    if (rows.length === 0) {
      return res.json({ message: 'Tidak ada peminjaman terlambat.', sent: false });
    }

    await notifyOverdueLoans(rows);

    res.json({
      message: `Notifikasi ${rows.length} peminjaman terlambat berhasil dikirim ke grup Telegram.`,
      sent: true,
      count: rows.length,
    });
  } catch (err) {
    console.error('Notify overdue error:', err);
    res.status(500).json({ error: 'Gagal mengirim notifikasi.' });
  }
});

// GET /api/loans/due-reminders — Cek peminjaman yang jatuh tempo besok (untuk cron/scheduler)
router.get('/due-reminders', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses hanya untuk admin.' });
    }

    const { rows } = await pool.query(`
      SELECT l.id, l.due_date, l.borrower_id,
             i.name AS item_name,
             u.full_name AS borrower_name,
             to_jsonb(u)->>'telegram_username' AS borrower_telegram_username,
             to_jsonb(u)->>'telegram_chat_id' AS borrower_telegram_chat_id
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      WHERE l.status = 'DIPINJAM'
        AND l.due_date = CURRENT_DATE + INTERVAL '1 day'
    `);

    // Kirim notifikasi Telegram untuk setiap peminjaman yang jatuh tempo besok
    let sentCount = 0;
    for (const loan of rows) {
      await notifyLoanDueReminder(
        {
          fullName: loan.borrower_name,
          username: loan.borrower_telegram_username,
          chatId: loan.borrower_telegram_chat_id,
        },
        loan.borrower_name,
        loan.item_name,
        new Date(loan.due_date).toLocaleDateString('id-ID')
      );
      sentCount++;
    }

    res.json({
      message: `${sentCount} pengingat berhasil dikirim.`,
      loans: rows,
    });
  } catch (err) {
    console.error('Due reminders error:', err);
    res.status(500).json({ error: 'Gagal mengirim pengingat.' });
  }
});

export default router;
