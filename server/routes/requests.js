import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/requests — Semua permintaan + nama barang & pemohon
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, 
             i.name AS item_name, 
             u.full_name AS requester_name, 
             u.department AS requester_role
      FROM requests r
      JOIN items i ON r.item_id = i.id
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
    const { items, requester_id } = req.body;
    // items = [{ item_id, quantity }]

    if (!items || items.length === 0 || !requester_id) {
      return res.status(400).json({ error: 'Data permintaan tidak valid.' });
    }

    const results = [];
    for (const item of items) {
      // Generate req_code
      const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM requests');
      const nextNum = countResult[0].total + 1;
      const req_code = `REQ-${String(nextNum).padStart(3, '0')}`;

      const [result] = await pool.query(
        `INSERT INTO requests (req_code, item_id, requester_id, quantity, request_date, status, priority)
         VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', 'REGULER')`,
        [req_code, item.item_id, requester_id, item.quantity]
      );

      results.push({ id: result.insertId, req_code });
    }

    res.status(201).json({ message: 'Permintaan berhasil dikirim!', requests: results });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Gagal membuat permintaan.' });
  }
});

// PUT /api/requests/:id — Update status (Admin Approve/Reject)
router.put('/:id', async (req, res) => {
  try {
    const { status, reviewed_by } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status harus APPROVED atau REJECTED.' });
    }

    await pool.query(
      'UPDATE requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [status, reviewed_by || null, req.params.id]
    );

    res.json({ message: `Permintaan berhasil di-${status === 'APPROVED' ? 'setujui' : 'tolak'}.` });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Gagal mengupdate permintaan.' });
  }
});

export default router;
