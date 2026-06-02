ALTER TABLE requests
  DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE requests
  ADD CONSTRAINT requests_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'));

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NULL;
