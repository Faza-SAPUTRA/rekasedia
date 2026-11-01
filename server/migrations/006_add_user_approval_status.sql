-- Status persetujuan akun guru.
-- Akun lama (admin & guru hasil import) otomatis APPROVED supaya tidak terkunci.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approved_by INT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

CREATE INDEX IF NOT EXISTS users_status_idx
  ON users (role, status);
