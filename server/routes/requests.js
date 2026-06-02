import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/requests — Semua permintaan + nama barang & pemohon
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
      const { rows: countResult } = await pool.query('SELECT COUNT(*) AS total FROM requests');
      const nextNum = parseInt(countResult[0].total) + 1;
      const req_code = `REQ-${String(nextNum).padStart(3, '0')}`;

      const result = await pool.query(
        `INSERT INTO requests (req_code, item_id, requester_id, quantity, request_date, status, priority)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, 'PENDING', 'REGULER') RETURNING id`,
        [req_code, item.item_id, requester_id, item.quantity]
      );

      results.push({ id: result.rows[0].id, req_code });
    }

    res.status(201).json({ message: 'Permintaan berhasil dikirim!', requests: results });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Gagal membuat permintaan.' });
  }
});

// PUT /api/requests/:id — Update status (Admin Approve/Reject)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, reviewed_by } = req.body;

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Status permintaan tidak valid.' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id, item_id, quantity, status FROM requests WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const request = rows[0];

    if (!request) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Permintaan tidak ditemukan.' });
    }

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

    await client.query('COMMIT');
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
