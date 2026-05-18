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

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
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

// GET /api/reports/teacher/:userId - Laporan personal guru dari Supabase
router.get('/teacher/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'User guru tidak valid.' });
    }

    const { rows: requestRows } = await pool.query(
      `
        SELECT
          EXTRACT(MONTH FROM request_date)::int AS month_order,
          COALESCE(SUM(quantity), 0)::int AS total_items_requested,
          COUNT(*)::int AS request_count,
          COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_count,
          COUNT(*) FILTER (WHERE status <> 'PENDING')::int AS completed_request_count
        FROM requests
        WHERE requester_id = $1
        GROUP BY month_order
      `,
      [userId]
    );

    const { rows: loanRows } = await pool.query(
      `
        SELECT
          EXTRACT(MONTH FROM borrow_date)::int AS month_order,
          COUNT(*)::int AS loan_count,
          COUNT(*) FILTER (WHERE status = 'DIPINJAM')::int AS active_loan_count,
          COUNT(*) FILTER (WHERE status = 'DIKEMBALIKAN')::int AS returned_loan_count
        FROM loans
        WHERE borrower_id = $1
        GROUP BY month_order
      `,
      [userId]
    );

    const monthMap = new Map();

    for (const row of requestRows) {
      monthMap.set(row.month_order, {
        month_order: row.month_order,
        month_name: MONTH_NAMES[row.month_order - 1],
        total_items_requested: row.total_items_requested,
        request_count: row.request_count,
        pending_count: row.pending_count,
        completed_request_count: row.completed_request_count,
        loan_count: 0,
        active_loan_count: 0,
        returned_loan_count: 0,
      });
    }

    for (const row of loanRows) {
      const existing = monthMap.get(row.month_order) || {
        month_order: row.month_order,
        month_name: MONTH_NAMES[row.month_order - 1],
        total_items_requested: 0,
        request_count: 0,
        pending_count: 0,
        completed_request_count: 0,
        loan_count: 0,
        active_loan_count: 0,
        returned_loan_count: 0,
      };

      existing.loan_count = row.loan_count;
      existing.active_loan_count = row.active_loan_count;
      existing.returned_loan_count = row.returned_loan_count;
      monthMap.set(row.month_order, existing);
    }

    const reports = Array.from(monthMap.values())
      .sort((a, b) => a.month_order - b.month_order)
      .map((row) => ({
        ...row,
        status: row.pending_count > 0 ? 'Menunggu Validasi' : 'Tervalidasi',
      }));

    const stats = reports.reduce(
      (acc, row) => ({
        totalItemsRequested: acc.totalItemsRequested + row.total_items_requested,
        activeLoansCount: acc.activeLoansCount + row.active_loan_count,
        pendingRequestsCount: acc.pendingRequestsCount + row.pending_count,
        historyCount: acc.historyCount + row.completed_request_count + row.returned_loan_count,
      }),
      {
        totalItemsRequested: 0,
        activeLoansCount: 0,
        pendingRequestsCount: 0,
        historyCount: 0,
      }
    );

    res.json({ stats, reports });
  } catch (err) {
    console.error('Get teacher report error:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan guru.' });
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
