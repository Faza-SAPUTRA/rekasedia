-- ============================================
-- RekaSedia School Inventory System
-- PostgreSQL Database Schema + Seed Data
-- ============================================

-- DROP TABLES IF EXISTS
DROP TABLE IF EXISTS monthly_reports CASCADE;
DROP TABLE IF EXISTS password_reset_requests CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  nip VARCHAR(30) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'guru')) DEFAULT 'guru',
  department VARCHAR(100) DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  temporary_password_expires_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: password_reset_requests
-- ============================================
CREATE TABLE password_reset_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_code VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED')) DEFAULT 'PENDING',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by INT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP DEFAULT NULL,
  expires_at TIMESTAMP DEFAULT NULL,
  used_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX password_reset_requests_status_idx
  ON password_reset_requests (status, requested_at DESC);

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(1, 'Admin Staff', 'admin@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'admin', 'Administrasi'), -- Hashed password
(2, 'Budi Utomo', 'budi.utomo@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'guru', 'Matematika'),
(3, 'Siti Aminah', 'siti.aminah@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'guru', 'Tata Usaha'),
(4, 'Ahmad Faisal', 'ahmad.faisal@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'guru', 'Fisika'),
(5, 'Dewi Lestari', 'dewi.lestari@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'guru', 'Kesiswaan'),
(6, 'Ibu Sarah Putri', 'sarah.putri@rekasedia.sch.id', '$2b$10$JPEDHd29VuSNjSUpKnjjFO7w2WkAegXDbS1OXOcfMLA7i.EkhbTmC', 'guru', 'Wali Kelas 10-A');

-- Note: The dummy password hashes are standardized bcrypt hashes ($2a$). We will seed them properly.

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL
);

INSERT INTO categories (id, name, description) VALUES
(1, 'ATK', 'Alat Tulis Kantor'),
(2, 'Kertas', 'Produk kertas dan cetakan'),
(3, 'Elektronik', 'Peralatan elektronik dan digital'),
(4, 'Kebersihan', 'Alat kebersihan dan kesehatan'),
(5, 'Furnitur', 'Meja, kursi, papan tulis, dan perlengkapan kelas jangka panjang');

-- ============================================
-- TABLE: items
-- ============================================
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'Unit',
  description TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  is_loanable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(1, 'Spidol Marker Set', 1, 15, 'Set', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', '/assets/items/spidol_hitam.png', FALSE),
(2, 'Kertas A4 80gr', 2, 2, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', '/assets/items/kertas_hvs_a4.png', FALSE),
(3, 'Stapler Besar HD', 1, 8, 'Unit', 'Stapler heavy-duty untuk dokumen tebal.', NULL, FALSE),
(4, 'Buku Catatan Eksklusif', 1, 20, 'Unit', 'Buku catatan hardcover premium untuk pencatatan.', NULL, FALSE),
(5, 'Kabel HDMI 4K 2m', 3, 12, 'Unit', 'Kabel HDMI 4K untuk koneksi proyektor.', '/assets/items/kabel_hdmi.png', FALSE),
(6, 'Tinta Printer Black', 1, 4, 'Botol', 'Tinta printer HP Black untuk printer kantor.', '/assets/items/tinta_printer.png', FALSE),
(7, 'Whiteboard Marker', 1, 45, 'Unit', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', '/assets/items/spidol_hitam.png', FALSE),
(8, 'Kertas A4 HVS', 2, 12, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', '/assets/items/kertas_hvs_a4.png', FALSE),
(9, 'Proyektor Digital', 3, 4, 'Unit', 'Unit proyektor portabel lengkap dengan kabel HDMI/VGA.', '/assets/items/proyektor_epson.png', TRUE),
(10, 'Masker Medis', 4, 20, 'Box', 'Masker 3-ply standar kesehatan untuk kebutuhan UKS/Kelas.', NULL, FALSE),
(11, 'Tinta Toner Laserjet', 1, 1, 'Unit', 'Toner untuk printer laserjet kantor.', '/assets/items/tinta_printer.png', FALSE),
(12, 'Materai 10.000', 1, 3, 'Lembar', 'Materai tempel Rp10.000 untuk dokumen resmi.', NULL, FALSE),
(13, 'Digital Projector Epson X-400', 3, 3, 'Unit', 'Proyektor Epson X-400 untuk ruang rapat dan kelas.', '/assets/items/proyektor_epson.png', TRUE),
(14, 'Portable Speaker JBL Boombox', 3, 2, 'Unit', 'Speaker portabel JBL untuk kegiatan sekolah.', '/assets/items/speaker_jbl.png', TRUE),
(15, 'MacBook Air M2 Silver', 3, 1, 'Unit', 'Laptop MacBook Air M2 untuk keperluan presentasi.', NULL, TRUE),
(16, 'Sticky Notes Neon', 1, 30, 'Pack', 'Sticky notes warna neon untuk penanda dokumen.', NULL, FALSE),
(17, 'Spidol Whiteboard (Biru)', 1, 25, 'Unit', 'Spidol whiteboard warna biru.', '/assets/items/spidol_hitam.png', FALSE),
(18, 'Buku Induk Siswa 2023', 1, 10, 'Unit', 'Buku induk untuk pencatatan data siswa tahun 2023.', NULL, FALSE),
(19, 'Meja Kelas Kayu', 5, 24, 'Unit', 'Meja kelas untuk penggunaan jangka panjang.', NULL, TRUE),
(20, 'Kursi Siswa', 5, 36, 'Unit', 'Kursi siswa untuk ruang kelas.', NULL, TRUE),
(21, 'Papan Tulis Whiteboard', 5, 6, 'Unit', 'Papan tulis kelas untuk aset sekolah.', NULL, TRUE);

-- ============================================
-- TABLE: requests
-- ============================================
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  req_code VARCHAR(20) NOT NULL UNIQUE,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  requester_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  request_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')) DEFAULT 'PENDING',
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('REGULER', 'URGENT')) DEFAULT 'REGULER',
  notes TEXT DEFAULT NULL,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP DEFAULT NULL,
  completed_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO requests (id, req_code, item_id, requester_id, quantity, request_date, status, priority) VALUES
(1, 'REQ-001', 2, 2, 5, '2023-10-24', 'PENDING', 'REGULER'),
(2, 'REQ-002', 6, 3, 2, '2023-10-24', 'PENDING', 'URGENT'),
(3, 'REQ-003', 17, 4, 10, '2023-10-23', 'PENDING', 'REGULER'),
(4, 'REQ-004', 18, 5, 3, '2023-10-23', 'PENDING', 'REGULER');

-- ============================================
-- TABLE: loans
-- ============================================
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  borrower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE DEFAULT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('DIPINJAM', 'DIKEMBALIKAN')) DEFAULT 'DIPINJAM',
  condition_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO loans (id, item_id, borrower_id, borrow_date, due_date, status) VALUES
(1, 13, 6, '2023-10-20', '2023-10-25', 'DIPINJAM'),
(2, 14, 6, '2023-10-20', '2023-10-28', 'DIPINJAM'),
(3, 15, 6, '2023-10-15', '2023-10-30', 'DIPINJAM');

-- ============================================
-- TABLE: monthly_reports
-- ============================================
CREATE TABLE monthly_reports (
  id SERIAL PRIMARY KEY,
  semester VARCHAR(50) NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  month_order INT NOT NULL,
  total_items_ordered INT NOT NULL DEFAULT 0,
  total_assets_borrowed INT NOT NULL DEFAULT 0
);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(1, 'Semester Ganjil 2025/2026', 'Januari', 1, 124, 12),
(2, 'Semester Ganjil 2025/2026', 'Februari', 2, 89, 8),
(3, 'Semester Ganjil 2025/2026', 'Maret', 3, 156, 15),
(4, 'Semester Ganjil 2025/2026', 'April', 4, 42, 5),
(5, 'Semester Ganjil 2025/2026', 'Mei', 5, 110, 10),
(6, 'Semester Ganjil 2025/2026', 'Juni', 6, 95, 9);

-- ============================================
-- SEQUENCE SYNC FOR POSTGRESQL
-- ============================================
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('password_reset_requests', 'id'), coalesce(max(id), 1)) FROM password_reset_requests;
SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('items', 'id'), coalesce(max(id), 1)) FROM items;
SELECT setval(pg_get_serial_sequence('requests', 'id'), coalesce(max(id), 1)) FROM requests;
SELECT setval(pg_get_serial_sequence('loans', 'id'), coalesce(max(id), 1)) FROM loans;
SELECT setval(pg_get_serial_sequence('monthly_reports', 'id'), coalesce(max(id), 1)) FROM monthly_reports;
