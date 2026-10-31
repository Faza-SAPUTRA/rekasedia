-- ============================================
-- RekaSedia: Row-Level Security (RLS) Policies
-- Migration 004 — Keamanan berlapis di level database
--
-- Strategi:
-- Backend Express menggunakan connection pool (pg), bukan Supabase Client.
-- Sebelum setiap query yang butuh RLS, backend harus menjalankan:
--   SET LOCAL app.current_user_id = '<user_id>';
--   SET LOCAL app.current_user_role = '<role>';
--
-- Kebijakan:
-- 1. Admin → full access (SELECT, INSERT, UPDATE, DELETE) di semua tabel
-- 2. Guru  → SELECT semua items & categories
--          → SELECT/INSERT requests & loans milik sendiri saja
--          → Tidak boleh UPDATE/DELETE data manapun
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Ambil current user role dari session variable
CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
  SELECT COALESCE(current_setting('app.current_user_role', true), 'anon');
$$ LANGUAGE SQL STABLE;

-- Ambil current user id dari session variable
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS INT AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_user_id', true), ''), '0')::INT;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- TABLE: items — Inventaris
-- ============================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY items_admin_all ON items
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: read-only
CREATE POLICY items_guru_select ON items
  FOR SELECT
  USING (current_app_role() IN ('admin', 'guru'));

-- ============================================
-- TABLE: categories — Kategori Barang
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY categories_admin_all ON categories
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: read-only
CREATE POLICY categories_guru_select ON categories
  FOR SELECT
  USING (current_app_role() IN ('admin', 'guru'));

-- ============================================
-- TABLE: requests — Permintaan ATK
-- ============================================
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Admin: full access (approve, reject, dll)
CREATE POLICY requests_admin_all ON requests
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: hanya bisa lihat permintaan milik sendiri
CREATE POLICY requests_guru_select ON requests
  FOR SELECT
  USING (current_app_role() = 'guru' AND requester_id = current_app_user_id());

-- Guru: hanya bisa buat permintaan baru (INSERT) atas nama sendiri
CREATE POLICY requests_guru_insert ON requests
  FOR INSERT
  WITH CHECK (current_app_role() = 'guru' AND requester_id = current_app_user_id());

-- ============================================
-- TABLE: loans — Peminjaman Aset
-- ============================================
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY loans_admin_all ON loans
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: hanya bisa lihat peminjaman milik sendiri
CREATE POLICY loans_guru_select ON loans
  FOR SELECT
  USING (current_app_role() = 'guru' AND borrower_id = current_app_user_id());

-- Guru: hanya bisa buat peminjaman baru atas nama sendiri
CREATE POLICY loans_guru_insert ON loans
  FOR INSERT
  WITH CHECK (current_app_role() = 'guru' AND borrower_id = current_app_user_id());

-- ============================================
-- TABLE: users — Data Pengguna
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: hanya bisa lihat profil sendiri
CREATE POLICY users_guru_select ON users
  FOR SELECT
  USING (current_app_role() = 'guru' AND id = current_app_user_id());

-- Guru: bisa update profil sendiri (ganti password, dll)
CREATE POLICY users_guru_update ON users
  FOR UPDATE
  USING (current_app_role() = 'guru' AND id = current_app_user_id())
  WITH CHECK (current_app_role() = 'guru' AND id = current_app_user_id());

-- Special: Allow login query (before role is set) - bypass via service role
-- Auth routes connect WITHOUT RLS context, so they use the pool owner (postgres role)
-- which bypasses RLS by default.

-- ============================================
-- TABLE: audit_logs — Log Audit (append-only)
-- ============================================
-- Note: audit_logs table from migration 003 should be readable by admin only.
-- We enable RLS if the table exists.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY audit_admin_all ON audit_logs
      FOR ALL
      USING (current_app_role() = ''admin'')
      WITH CHECK (current_app_role() = ''admin'')';
  END IF;
END $$;

-- ============================================
-- TABLE: monthly_reports — Laporan Bulanan
-- ============================================
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY reports_admin_all ON monthly_reports
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: read-only
CREATE POLICY reports_guru_select ON monthly_reports
  FOR SELECT
  USING (current_app_role() IN ('admin', 'guru'));

-- ============================================
-- TABLE: password_reset_requests
-- ============================================
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admin: full access (review requests)
CREATE POLICY pwr_admin_all ON password_reset_requests
  FOR ALL
  USING (current_app_role() = 'admin')
  WITH CHECK (current_app_role() = 'admin');

-- Guru: hanya bisa INSERT (ajukan request) dan lihat milik sendiri
CREATE POLICY pwr_guru_select ON password_reset_requests
  FOR SELECT
  USING (current_app_role() = 'guru' AND user_id = current_app_user_id());

CREATE POLICY pwr_guru_insert ON password_reset_requests
  FOR INSERT
  WITH CHECK (current_app_role() = 'guru');

