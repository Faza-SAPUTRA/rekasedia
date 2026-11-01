import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.use(cors());
// A 2 MB image becomes larger after base64 encoding inside the JSON payload.
app.use(express.json({ limit: '4mb' }));

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
    console.log('   Routes:');
    console.log('   - POST /api/auth/login');
    console.log('   - POST /api/auth/register');
    console.log('   - GET  /api/items');
    console.log('   - GET  /api/items/categories/all');
    console.log('   - GET  /api/requests');
    console.log('   - POST /api/requests');
    console.log('   - PUT  /api/requests/:id');
    console.log('   - GET  /api/loans');
    console.log('   - POST /api/loans             (booking baru)');
    console.log('   - GET  /api/loans/availability (cek jadwal)');
    console.log('   - PUT  /api/loans/:id/return');
    console.log('   - GET  /api/loans/due-reminders');
    console.log('   - GET  /api/reports');
    console.log('   - GET  /api/reports/stats');
    console.log('   - GET  /api/audit              (audit trail)');
    console.log('   - GET  /api/audit/stats');
  });
}

export default app;
