import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'NIP/email dan password wajib diisi.' });
    }

    const identifier = String(email).trim().toLowerCase();
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR nip = $1 LIMIT 1',
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'NIP atau email tidak ditemukan.' });
    }

    const user = rows[0];
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
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (rows.length === 0) {
      // To prevent email enumeration, we still return success or a generic message
      return res.json({ message: 'Jika email terdaftar, instruksi akan dikirim.' });
    }

    // In a real application, you would generate a token and send an email here.
    // Since we don't have an email service configured, we just simulate success.
    
    res.json({ message: 'Jika email terdaftar, instruksi akan dikirim.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
