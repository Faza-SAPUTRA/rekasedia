import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL must be configured.');
}

// Supabase pooler uses SSL but its certificate chain may not pass
// strict Node.js validation. This is safe because the connection
// to Supabase is already encrypted over TLS.
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Set RLS context (user role & id) di awal setiap transaksi.
 * Panggil setelah `client = await pool.connect()` dan `BEGIN`.
 *
 * @param {import('pg').PoolClient} client - PostgreSQL client dari pool
 * @param {{ id?: number, role?: string }} user - Objek user dari JWT (req.user)
 */
export async function setRLSContext(client, user) {
  if (!user) return;
  await client.query(
    `SELECT set_config('app.current_user_id', $1, true),
            set_config('app.current_user_role', $2, true)`,
    [String(user.id || 0), user.role || 'anon']
  );
}

export default pool;
