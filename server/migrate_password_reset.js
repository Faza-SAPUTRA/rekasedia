import pool from './db.js';

const statements = [
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS temporary_password_expires_at TIMESTAMP DEFAULT NULL',
  `CREATE TABLE IF NOT EXISTS password_reset_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED')) DEFAULT 'PENDING',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    used_at TIMESTAMP DEFAULT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS password_reset_requests_status_idx
    ON password_reset_requests (status, requested_at DESC)`,
];

const client = await pool.connect();

try {
  await client.query('BEGIN');
  for (const statement of statements) await client.query(statement);
  await client.query('COMMIT');
  console.log('Password reset migration completed.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Password reset migration failed:', error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
