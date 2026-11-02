import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sqlPath = path.join(__dirname, 'migrations', '009_restore_furnitur_category.sql');
  await pool.query(fs.readFileSync(sqlPath, 'utf8'));
  const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY id');
  console.log('Kategori sekarang:', rows.map((r) => `${r.id}:${r.name}`).join(' | '));
}

run()
  .catch((error) => {
    console.error('Migrasi gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
