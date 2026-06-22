import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL must be configured.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
