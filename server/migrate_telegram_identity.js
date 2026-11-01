import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sqlPath = path.join(__dirname, 'migrations', '005_add_user_telegram_identity.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await pool.query(sql);
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users'
         AND column_name IN ('telegram_username', 'telegram_chat_id')
       ORDER BY column_name`
    );
    console.log('Migrasi identitas Telegram selesai. Kolom terpasang:', rows.map((r) => r.column_name).join(', '));
  } catch (error) {
    console.error('Migrasi identitas Telegram gagal:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
