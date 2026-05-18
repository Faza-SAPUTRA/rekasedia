import pkg from 'pg';

const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  'postgresql://postgres:niggafuckmyass123@db.rwnhwojlvzeywyocvoic.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
