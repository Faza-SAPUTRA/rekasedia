import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import requestRoutes from './routes/requests.js';
import loanRoutes from './routes/loans.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RekaSedia API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ RekaSedia API Server running at http://localhost:${PORT}`);
  console.log(`   Routes:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/items`);
  console.log(`   - GET  /api/items/categories/all`);
  console.log(`   - GET  /api/requests`);
  console.log(`   - POST /api/requests`);
  console.log(`   - PUT  /api/requests/:id`);
  console.log(`   - GET  /api/loans`);
  console.log(`   - PUT  /api/loans/:id/return`);
  console.log(`   - GET  /api/reports`);
  console.log(`   - GET  /api/reports/stats`);
});
