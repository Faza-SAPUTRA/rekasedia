import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/audit — Ambil semua log audit (Admin only)
router.get('/', async (req, res) => {
  try {
    // Hanya admin yang boleh akses
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses hanya untuk admin.' });
    }

    const {
      page = 1,
      limit = 50,
      table,
      action,
      actor_id,
      from_date,
      to_date,
    } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (table) {
      conditions.push(`al.table_affected = $${paramIndex++}`);
      params.push(table);
    }
    if (action) {
      conditions.push(`al.action_type = $${paramIndex++}`);
      params.push(String(action).toUpperCase());
    }
    if (actor_id) {
      conditions.push(`al.actor_id = $${paramIndex++}`);
      params.push(Number(actor_id));
    }
    if (from_date) {
      conditions.push(`al.timestamp >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`al.timestamp <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

    // Count total for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT al.*,
              u.full_name AS actor_name,
              u.email AS actor_email
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ${whereClause}
       ORDER BY al.timestamp DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    res.json({
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Gagal mengambil data audit log.' });
  }
});

// GET /api/audit/stats — Ringkasan statistik audit
router.get('/stats', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses hanya untuk admin.' });
    }

    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total_logs,
        COUNT(*) FILTER (WHERE action_type = 'INSERT') AS total_inserts,
        COUNT(*) FILTER (WHERE action_type = 'UPDATE') AS total_updates,
        COUNT(*) FILTER (WHERE action_type = 'DELETE') AS total_deletes,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) AS today_count,
        COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') AS week_count
      FROM audit_logs
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error('Get audit stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik audit.' });
  }
});

export default router;
