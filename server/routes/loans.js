import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/loans — Semua peminjaman + nama barang & peminjam
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
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

// PUT /api/loans/:id/return — Kembalikan barang
router.put('/:id/return', async (req, res) => {
  try {
    await pool.query(
      "UPDATE loans SET status = 'DIKEMBALIKAN', return_date = CURDATE() WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: 'Barang berhasil dikembalikan.' });
  } catch (err) {
    console.error('Return loan error:', err);
    res.status(500).json({ error: 'Gagal mengembalikan barang.' });
  }
});

export default router;
