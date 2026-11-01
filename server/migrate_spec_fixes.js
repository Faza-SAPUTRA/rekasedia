import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  '006_add_user_approval_status.sql',
  '007_add_item_min_stock.sql',
  '008_add_missing_categories.sql',
];

async function run() {
  for (const file of migrations) {
    const sqlPath = path.join(__dirname, 'migrations', file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('OK migrasi:', file);
  }

  const { rows: userCols } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'users' AND column_name IN ('status', 'approved_at', 'approved_by')
     ORDER BY column_name`
  );
  const { rows: itemCols } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'items' AND column_name = 'min_stock'`
  );
  const { rows: cats } = await pool.query('SELECT name FROM categories ORDER BY id');

  console.log('Kolom users:', userCols.map((r) => r.column_name).join(', '));
  console.log('Kolom items:', itemCols.map((r) => r.column_name).join(', ') || '(kosong)');
  console.log('Kategori:', cats.map((r) => r.name).join(' | '));
}

run()
  .catch((error) => {
    console.error('Migrasi gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
