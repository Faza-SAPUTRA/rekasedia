-- ============================================
-- Migration 003: Audit Trail System
-- Creates audit_logs table + automatic triggers
-- ============================================

-- Table: audit_logs (append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actor_id INT REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(50),
  action_type VARCHAR(20) NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE'
  table_affected VARCHAR(50) NOT NULL,
  record_id INT,
  change_details JSONB,
  ip_address VARCHAR(50)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_idx ON audit_logs (table_affected);

-- ============================================
-- Trigger function: auto-log changes
-- ============================================
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action_type, table_affected, record_id, change_details)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      0
    ),
    jsonb_build_object(
      'old', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::jsonb ELSE NULL END,
      'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Attach triggers to tracked tables
-- ============================================

-- Items table
DROP TRIGGER IF EXISTS audit_items_trigger ON items;
CREATE TRIGGER audit_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Requests table
DROP TRIGGER IF EXISTS audit_requests_trigger ON requests;
CREATE TRIGGER audit_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE ON requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Loans table
DROP TRIGGER IF EXISTS audit_loans_trigger ON loans;
CREATE TRIGGER audit_loans_trigger
  AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
