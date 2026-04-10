import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/items — Semua barang + nama kategori
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, c.name AS category_name 
      FROM items i 
      JOIN categories c ON i.category_id = c.id
      ORDER BY i.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Gagal mengambil data barang.' });
  }
});

// GET /api/items/:id — Detail satu barang
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, c.name AS category_name 
      FROM items i 
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Gagal mengambil detail barang.' });
  }
});

// GET /api/categories — Semua kategori
router.get('/categories/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori.' });
  }
});

export default router;
