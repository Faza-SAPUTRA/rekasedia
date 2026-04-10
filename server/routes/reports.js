import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/reports — Data laporan bulanan
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM monthly_reports ORDER BY month_order ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Gagal mengambil data laporan.' });
  }
});

// GET /api/stats — Statistik dashboard
router.get('/stats', async (req, res) => {
  try {
    // Total semua stok
    const [totalItems] = await pool.query('SELECT SUM(stock) AS total FROM items');

    // Peminjaman aktif
    const [activeLoans] = await pool.query("SELECT COUNT(*) AS total FROM loans WHERE status = 'DIPINJAM'");

    // Permintaan pending
    const [pendingRequests] = await pool.query("SELECT COUNT(*) AS total FROM requests WHERE status = 'PENDING'");

    // Item stok kritis (≤ 5, non-loanable)
    const [criticalStock] = await pool.query('SELECT COUNT(*) AS total FROM items WHERE stock <= 5 AND is_loanable = 0');

    // Item stok kritis detail
    const [criticalItems] = await pool.query(`
      SELECT i.*, c.name AS category_name 
      FROM items i 
      JOIN categories c ON i.category_id = c.id
      WHERE i.stock <= 5 AND i.is_loanable = 0
      ORDER BY i.stock ASC
    `);

    res.json({
      totalItems: totalItems[0].total || 0,
      activeLoans: activeLoans[0].total || 0,
      pendingRequests: pendingRequests[0].total || 0,
      criticalStockCount: criticalStock[0].total || 0,
      criticalItems,
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

export default router;
