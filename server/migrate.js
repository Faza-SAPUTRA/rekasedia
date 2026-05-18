import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Starting migration to Supabase (PostgreSQL)...');
  try {
    const schemaPath = path.join(__dirname, 'postgres_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Get a client connection to support running multiple queries in one block
    const client = await pool.connect();
    try {
      console.log('📡 Connected to Supabase PostgreSQL!');
      console.log('⏳ Running schema & seed data...');
      await client.query(sql);
      console.log('✅ Database successfully initialized and seeded on Supabase!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
