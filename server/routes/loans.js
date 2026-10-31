import { Router } from 'express';
import pool, { setRLSContext } from '../db.js';
import { logAudit } from '../services/auditLogger.js';
import { notifyNewLoan, notifyLoanDueReminder, ADMIN_CHAT_ID } from '../services/telegram.js';

const router = Router();

// GET /api/loans — Semua peminjaman + nama barang & peminjam
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, 
             i.name AS item_name,
             i.image_url AS item_image,
             u.full_name AS borrower_name
      FROM loans l
      JOIN items i ON l.item_id = i.id
      JOIN users u ON l.borrower_id = u.id
      ORDER BY l.borrow_date DESC
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
    const { item_id, borrower_id, borrow_date, due_date, condition_note } = req.body;

    // Validasi input
    if (!item_id || !borrower_id || !borrow_date || !due_date) {
      return res.status(400).json({ error: 'Data peminjaman tidak lengkap. Wajib: item_id, borrower_id, borrow_date, due_date.' });
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
    notifyNewLoan(borrowerName, item.name, borrow_date, due_date);

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

// PUT /api/loans/:id/return — Kembalikan barang
router.put('/:id/return', async (req, res) => {
  const client = await pool.connect();
  try {
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
      "UPDATE loans SET status = 'DIKEMBALIKAN', return_date = CURRENT_DATE WHERE id = $1",
      [req.params.id]
    );

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

// GET /api/loans/due-reminders — Cek peminjaman yang jatuh tempo besok (untuk cron/scheduler)
router.get('/due-reminders', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses hanya untuk admin.' });
    }

    const { rows } = await pool.query(`
      SELECT l.id, l.due_date, l.borrower_id,
             i.name AS item_name,
             u.full_name AS borrower_name
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
        ADMIN_CHAT_ID,
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
