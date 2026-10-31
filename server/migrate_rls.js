import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runRLSMigration() {
  console.log('🔐 Menjalankan migrasi RLS (Row-Level Security)...');
  const client = await pool.connect();
  try {
    // Jalankan migrasi audit_logs dulu (jika belum)
    const auditSql = fs.readFileSync(path.join(__dirname, 'migrations', '003_create_audit_logs.sql'), 'utf8');
    try {
      await client.query(auditSql);
      console.log('✅ Migrasi 003 (audit_logs) berhasil.');
    } catch (err) {
      if (err.code === '42P07') { // table already exists
        console.log('ℹ️  Tabel audit_logs sudah ada, skip.');
      } else {
        console.warn('⚠️  Migrasi 003:', err.message);
      }
    }

    // Jalankan migrasi RLS
    const rlsSql = fs.readFileSync(path.join(__dirname, 'migrations', '004_enable_rls_policies.sql'), 'utf8');
    await client.query(rlsSql);
    console.log('✅ RLS policies berhasil diterapkan!');
    
    // Verifikasi
    const { rows } = await client.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    console.log(`\n📋 ${rows.length} policy terdaftar:`);
    rows.forEach(r => console.log(`   • ${r.tablename}: ${r.policyname}`));
    
  } catch (err) {
    console.error('❌ Migrasi RLS gagal:', err.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runRLSMigration();

