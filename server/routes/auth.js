import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = Router();

function createRequestCode() {
  return `RST-${crypto.randomInt(100000, 1000000)}`;
}

function createTemporaryPassword() {
  return `Tmp-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses hanya untuk admin.' });
  }
  next();
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'NIP/email dan password wajib diisi.' });
    }

    const identifier = String(email).trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT *,
              temporary_password_expires_at IS NOT NULL
              AND temporary_password_expires_at <= CURRENT_TIMESTAMP AS temporary_password_expired
       FROM users WHERE LOWER(email) = $1 OR nip = $1 LIMIT 1`,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'NIP atau email tidak ditemukan.' });
    }

    const user = rows[0];

    if (
      user.must_change_password &&
      user.temporary_password_expired
    ) {
      return res.status(401).json({ error: 'Password sementara kedaluwarsa. Ajukan reset kembali.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Password salah.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        nip: user.nip,
        role: user.role,
        department: user.department,
        must_change_password: user.must_change_password,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role, department } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    // Cek email sudah terdaftar
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [full_name, email, password_hash, role || 'guru', department || null]
    );

    const newUser = {
      id: result.rows[0].id,
      full_name,
      email,
      role: role || 'guru',
      department: department || null,
    };

    const token = generateToken(newUser);

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'NIP atau email wajib diisi.' });
    }

    const identifier = String(email).trim().toLowerCase();
    const publicCode = createRequestCode();
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 OR nip = $1 LIMIT 1',
      [identifier]
    );

    if (rows.length === 0) {
      return res.json({
        message: 'Jika akun terdaftar, permintaan reset akan diteruskan ke admin sekolah.',
        request_code: publicCode,
      });
    }

    const userId = rows[0].id;
    const existing = await pool.query(
      `SELECT request_code FROM password_reset_requests
       WHERE user_id = $1 AND status = 'PENDING'
       ORDER BY requested_at DESC LIMIT 1`,
      [userId]
    );

    const requestCode = existing.rows[0]?.request_code || publicCode;
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO password_reset_requests (user_id, request_code) VALUES ($1, $2)',
        [userId, requestCode]
      );
    }

    res.json({
      message: 'Jika akun terdaftar, permintaan reset akan diteruskan ke admin sekolah.',
      request_code: requestCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/password-reset-requests — antrean reset untuk admin
router.get('/password-reset-requests', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pr.id, pr.request_code, pr.status, pr.requested_at,
              u.id AS user_id, u.full_name, u.email, u.nip, u.department
       FROM password_reset_requests pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.status = 'PENDING'
       ORDER BY pr.requested_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get password reset requests error:', err);
    res.status(500).json({ error: 'Gagal mengambil permintaan reset password.' });
  }
});

// PUT /api/auth/password-reset-requests/:id — setujui/tolak oleh admin
router.put('/password-reset-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = Number(req.params.id);
  const action = String(req.body.action || '').toUpperCase();

  if (!Number.isInteger(requestId) || !['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({ error: 'Permintaan atau tindakan tidak valid.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requestResult = await client.query(
      `SELECT pr.id, pr.user_id, pr.request_code, pr.status, u.full_name
       FROM password_reset_requests pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.id = $1 FOR UPDATE`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Permintaan reset tidak ditemukan.' });
    }

    const resetRequest = requestResult.rows[0];
    if (resetRequest.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Permintaan reset sudah diproses.' });
    }

    if (action === 'REJECTED') {
      await client.query(
        `UPDATE password_reset_requests
         SET status = 'REJECTED', processed_by = $1, processed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.user.id, requestId]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Permintaan reset ditolak.' });
    }

    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await client.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE,
           temporary_password_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, resetRequest.user_id]
    );
    await client.query(
      `UPDATE password_reset_requests
       SET status = 'APPROVED', processed_by = $1, processed_at = CURRENT_TIMESTAMP,
           expires_at = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
       WHERE id = $2`,
      [req.user.id, requestId]
    );
    await client.query(
      `UPDATE password_reset_requests
       SET status = 'EXPIRED'
       WHERE user_id = $1 AND status = 'PENDING' AND id <> $2`,
      [resetRequest.user_id, requestId]
    );

    await client.query('COMMIT');
    res.json({
      message: 'Password sementara berhasil dibuat.',
      request_code: resetRequest.request_code,
      full_name: resetRequest.full_name,
      temporary_password: temporaryPassword,
      expires_in_minutes: 30,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Process password reset request error:', err);
    res.status(500).json({ error: 'Gagal memproses reset password.' });
  } finally {
    client.release();
  }
});

// POST /api/auth/change-password — wajib setelah memakai password sementara
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || String(new_password).length < 8) {
      return res.status(400).json({ error: 'Password lama dan password baru minimal 8 karakter wajib diisi.' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0 || !(await bcrypt.compare(current_password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Password sementara/lama tidak sesuai.' });
    }
    if (await bcrypt.compare(new_password, rows[0].password_hash)) {
      return res.status(400).json({ error: 'Password baru harus berbeda dari password sebelumnya.' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE users
         SET password_hash = $1, must_change_password = FALSE,
             temporary_password_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, req.user.id]
      );
      await client.query(
        `UPDATE password_reset_requests
         SET status = 'USED', used_at = CURRENT_TIMESTAMP
         WHERE id = (
           SELECT id FROM password_reset_requests
           WHERE user_id = $1 AND status = 'APPROVED'
           ORDER BY processed_at DESC LIMIT 1
         )`,
        [req.user.id]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updatedUser = {
      ...rows[0],
      must_change_password: false,
      temporary_password_expires_at: null,
    };
    const token = generateToken(updatedUser);
    res.json({
      message: 'Password berhasil diperbarui.',
      token,
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        nip: updatedUser.nip,
        role: updatedUser.role,
        department: updatedUser.department,
        must_change_password: false,
      },
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Gagal memperbarui password.' });
  }
});

export default router;
