import jwt from 'jsonwebtoken';

const JWT_SECRET = 'rekasedia_secret_key_2026';

// Middleware: verifikasi JWT token dari header Authorization
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = user; // { id, email, role, full_name }
    next();
  });
}

// Helper: buat JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      department: user.department,
      must_change_password: Boolean(user.must_change_password),
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function requireCompletedPasswordChange(req, res, next) {
  if (req.user?.must_change_password) {
    return res.status(403).json({
      error: 'Anda wajib membuat password baru sebelum mengakses aplikasi.',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }
  next();
}

export { JWT_SECRET };
