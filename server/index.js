import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRoutes from './routes/auth.js';
import telegramRoutes from './routes/telegram.js';
import itemRoutes from './routes/items.js';
import requestRoutes from './routes/requests.js';
import loanRoutes from './routes/loans.js';
import reportRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import { authenticateToken, requireCompletedPasswordChange } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// === SECURITY HEADERS ===
// Helmet sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA — CSP handled by Vercel/frontend
  crossOriginEmbedderPolicy: false, // Allow embedded resources
}));

// === CORS CONFIGURATION ===
const allowedOrigins = [
  'http://localhost:5173',       // Vite dev
  'http://localhost:3001',       // Express dev
  'https://rekasedia.vercel.app', // Production
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// === RATE LIMITING ===
// General API rate limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.' },
});

// Stricter limit for auth endpoints: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

// A 2 MB image becomes larger after base64 encoding inside the JSON payload.
app.use(express.json({ limit: '4mb' }));

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
// Webhook Telegram: tanpa JWT, diverifikasi lewat secret token
app.use('/api/telegram', telegramRoutes);
const protectedApi = [authenticateToken, requireCompletedPasswordChange];
app.use('/api/items', protectedApi, itemRoutes);
app.use('/api/requests', protectedApi, requestRoutes);
app.use('/api/loans', protectedApi, loanRoutes);
app.use('/api/reports', protectedApi, reportRoutes);
app.use('/api/audit', protectedApi, auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RekaSedia API is running!' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`RekaSedia API Server running at http://localhost:${PORT}`);
    console.log('   Security: helmet ✅ | CORS whitelist ✅ | rate-limit ✅');
  });
}

export default app;
