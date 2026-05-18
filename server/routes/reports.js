import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const DEFAULT_MONTHLY_REPORTS = [
  ['Semester Ganjil 2025/2026', 'Januari', 1, 124, 12],
  ['Semester Ganjil 2025/2026', 'Februari', 2, 89, 8],
  ['Semester Ganjil 2025/2026', 'Maret', 3, 156, 15],
  ['Semester Ganjil 2025/2026', 'April', 4, 42, 5],
  ['Semester Ganjil 2025/2026', 'Mei', 5, 110, 10],
  ['Semester Ganjil 2025/2026', 'Juni', 6, 95, 9],
];

async function ensureMonthlyReportsSeeded() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM monthly_reports');
  if (rows[0].total > 0) return;

  await pool.query(
    `
      INSERT INTO monthly_reports
        (semester, month_name, month_order, total_items_ordered, total_assets_borrowed)
      VALUES
        ${DEFAULT_MONTHLY_REPORTS.map(
          (_, index) => `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
        ).join(', ')}
    `,
    DEFAULT_MONTHLY_REPORTS.flat()
  );
}

// GET /api/reports - Data laporan bulanan dari Supabase
router.get('/', async (req, res) => {
  try {
    await ensureMonthlyReportsSeeded();
    const { rows } = await pool.query('SELECT * FROM monthly_reports ORDER BY month_order ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Gagal mengambil data laporan.' });
  }
});

// GET /api/reports/stats - Statistik dashboard dari Supabase
router.get('/stats', async (req, res) => {
  try {
    const { rows: totalItems } = await pool.query('SELECT COALESCE(SUM(stock), 0)::int AS total FROM items');
    const { rows: activeLoans } = await pool.query("SELECT COUNT(*)::int AS total FROM loans WHERE status = 'DIPINJAM'");
    const { rows: pendingRequests } = await pool.query("SELECT COUNT(*)::int AS total FROM requests WHERE status = 'PENDING'");
    const { rows: todayRequests } = await pool.query('SELECT COUNT(*)::int AS total FROM requests WHERE request_date = CURRENT_DATE');
    const { rows: criticalStock } = await pool.query('SELECT COUNT(*)::int AS total FROM items WHERE stock <= 5 AND is_loanable = FALSE');
    const { rows: criticalItems } = await pool.query(`
      SELECT i.*, c.name AS category_name
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.stock <= 5 AND i.is_loanable = FALSE
      ORDER BY i.stock ASC
    `);

    res.json({
      totalItems: totalItems[0].total,
      activeLoans: activeLoans[0].total,
      pendingRequests: pendingRequests[0].total,
      todayRequests: todayRequests[0].total,
      criticalStockCount: criticalStock[0].total,
      criticalItems,
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

export default router;
