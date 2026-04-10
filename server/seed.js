import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // 1. Generate hash for 'admin123'
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    // 2. Read the SQL file
    const sqlPath = path.join(process.cwd(), 'rekasedia_dummy_seed.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 3. Replace placeholder with real hash
    sql = sql.replace(/\$2b\$10\$YourHashedPasswordHere/g, hash);
    
    // 4. Split SQL into individual statements
    // This is a naive split, but should work for this specific file
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    // 5. Execute each statement
    for (let statement of statements) {
      // Skip SET and other session-level commands if they fail in pool
      try {
        await pool.query(statement);
      } catch (err) {
        console.warn('Warning executing statement:', statement.substring(0, 50), '...');
        console.error(err.message);
      }
    }
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
