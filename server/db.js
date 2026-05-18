import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:niggafuckmyass123@db.rwnhwojlvzeywyocvoic.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
