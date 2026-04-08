-- ============================================
-- RekaSedia School Inventory System
-- MySQL Database Schema + Seed Data
-- Import this file into phpMyAdmin
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS rekasedia_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rekasedia_db;

-- ============================================
-- TABLE: users
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'guru') NOT NULL DEFAULT 'guru',
  department VARCHAR(100) DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(1, 'Admin Staff', 'admin@rekasedia.sch.id', '$2b$10$placeholder_hash_admin', 'admin', 'Administrasi');

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(2, 'Budi Utomo', 'budi.utomo@rekasedia.sch.id', '$2b$10$placeholder_hash_budi', 'guru', 'Matematika');

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(3, 'Siti Aminah', 'siti.aminah@rekasedia.sch.id', '$2b$10$placeholder_hash_siti', 'guru', 'Tata Usaha');

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(4, 'Ahmad Faisal', 'ahmad.faisal@rekasedia.sch.id', '$2b$10$placeholder_hash_ahmad', 'guru', 'Fisika');

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(5, 'Dewi Lestari', 'dewi.lestari@rekasedia.sch.id', '$2b$10$placeholder_hash_dewi', 'guru', 'Kesiswaan');

INSERT INTO users (id, full_name, email, password_hash, role, department) VALUES
(6, 'Ibu Sarah Putri', 'sarah.putri@rekasedia.sch.id', '$2b$10$placeholder_hash_sarah', 'guru', 'Wali Kelas 10-A');

-- ============================================
-- TABLE: categories
-- ============================================
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

INSERT INTO categories (id, name, description) VALUES
(1, 'ATK', 'Alat Tulis Kantor');

INSERT INTO categories (id, name, description) VALUES
(2, 'Kertas', 'Produk kertas dan cetakan');

INSERT INTO categories (id, name, description) VALUES
(3, 'Elektronik', 'Peralatan elektronik dan digital');

INSERT INTO categories (id, name, description) VALUES
(4, 'Kebersihan', 'Alat kebersihan dan kesehatan');

-- ============================================
-- TABLE: items
-- ============================================
DROP TABLE IF EXISTS items;
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'Unit',
  description TEXT DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  is_loanable TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(1, 'Spidol Marker Set', 1, 15, 'Set', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(2, 'Kertas A4 80gr', 2, 2, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(3, 'Stapler Besar HD', 1, 8, 'Unit', 'Stapler heavy-duty untuk dokumen tebal.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(4, 'Buku Catatan Eksklusif', 1, 20, 'Unit', 'Buku catatan hardcover premium untuk pencatatan.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(5, 'Kabel HDMI 4K 2m', 3, 12, 'Unit', 'Kabel HDMI 4K untuk koneksi proyektor.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(6, 'Tinta Printer Black', 1, 4, 'Botol', 'Tinta printer HP Black untuk printer kantor.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(7, 'Whiteboard Marker', 1, 45, 'Unit', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(8, 'Kertas A4 HVS', 2, 12, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(9, 'Proyektor Digital', 3, 4, 'Unit', 'Unit proyektor portabel lengkap dengan kabel HDMI/VGA.', NULL, 1);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(10, 'Masker Medis', 4, 20, 'Box', 'Masker 3-ply standar kesehatan untuk kebutuhan UKS/Kelas.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(11, 'Tinta Toner Laserjet', 1, 1, 'Unit', 'Toner untuk printer laserjet kantor.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(12, 'Materai 10.000', 1, 3, 'Lembar', 'Materai tempel Rp10.000 untuk dokumen resmi.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(13, 'Digital Projector Epson X-400', 3, 3, 'Unit', 'Proyektor Epson X-400 untuk ruang rapat dan kelas.', NULL, 1);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(14, 'Portable Speaker JBL Boombox', 3, 2, 'Unit', 'Speaker portabel JBL untuk kegiatan sekolah.', NULL, 1);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(15, 'MacBook Air M2 Silver', 3, 1, 'Unit', 'Laptop MacBook Air M2 untuk keperluan presentasi.', NULL, 1);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(16, 'Sticky Notes Neon', 1, 30, 'Pack', 'Sticky notes warna neon untuk penanda dokumen.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(17, 'Spidol Whiteboard (Biru)', 1, 25, 'Unit', 'Spidol whiteboard warna biru.', NULL, 0);

INSERT INTO items (id, name, category_id, stock, unit, description, image_url, is_loanable) VALUES
(18, 'Buku Induk Siswa 2023', 1, 10, 'Unit', 'Buku induk untuk pencatatan data siswa tahun 2023.', NULL, 0);

-- ============================================
-- TABLE: requests
-- ============================================
DROP TABLE IF EXISTS requests;
CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  req_code VARCHAR(20) NOT NULL UNIQUE,
  item_id INT NOT NULL,
  requester_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  request_date DATE NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  priority ENUM('REGULER', 'URGENT') NOT NULL DEFAULT 'REGULER',
  notes TEXT DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB;

INSERT INTO requests (id, req_code, item_id, requester_id, quantity, request_date, status, priority) VALUES
(1, 'REQ-001', 2, 2, 5, '2023-10-24', 'PENDING', 'REGULER');

INSERT INTO requests (id, req_code, item_id, requester_id, quantity, request_date, status, priority) VALUES
(2, 'REQ-002', 6, 3, 2, '2023-10-24', 'PENDING', 'URGENT');

INSERT INTO requests (id, req_code, item_id, requester_id, quantity, request_date, status, priority) VALUES
(3, 'REQ-003', 17, 4, 10, '2023-10-23', 'PENDING', 'REGULER');

INSERT INTO requests (id, req_code, item_id, requester_id, quantity, request_date, status, priority) VALUES
(4, 'REQ-004', 18, 5, 3, '2023-10-23', 'PENDING', 'REGULER');

-- ============================================
-- TABLE: loans
-- ============================================
DROP TABLE IF EXISTS loans;
CREATE TABLE loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrower_id INT NOT NULL,
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE DEFAULT NULL,
  status ENUM('DIPINJAM', 'DIKEMBALIKAN') NOT NULL DEFAULT 'DIPINJAM',
  condition_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (borrower_id) REFERENCES users(id)
) ENGINE=InnoDB;

INSERT INTO loans (id, item_id, borrower_id, borrow_date, due_date, status) VALUES
(1, 13, 6, '2023-10-20', '2023-10-25', 'DIPINJAM');

INSERT INTO loans (id, item_id, borrower_id, borrow_date, due_date, status) VALUES
(2, 14, 6, '2023-10-20', '2023-10-28', 'DIPINJAM');

INSERT INTO loans (id, item_id, borrower_id, borrow_date, due_date, status) VALUES
(3, 15, 6, '2023-10-15', '2023-10-30', 'DIPINJAM');

-- ============================================
-- TABLE: monthly_reports
-- ============================================
DROP TABLE IF EXISTS monthly_reports;
CREATE TABLE monthly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester VARCHAR(50) NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  month_order INT NOT NULL,
  total_items_ordered INT NOT NULL DEFAULT 0,
  total_assets_borrowed INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(1, 'Semester Ganjil 2025/2026', 'Januari', 1, 124, 12);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(2, 'Semester Ganjil 2025/2026', 'Februari', 2, 89, 8);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(3, 'Semester Ganjil 2025/2026', 'Maret', 3, 156, 15);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(4, 'Semester Ganjil 2025/2026', 'April', 4, 42, 5);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(5, 'Semester Ganjil 2025/2026', 'Mei', 5, 110, 10);

INSERT INTO monthly_reports (id, semester, month_name, month_order, total_items_ordered, total_assets_borrowed) VALUES
(6, 'Semester Ganjil 2025/2026', 'Juni', 6, 95, 9);

-- ============================================
-- END OF SCHEMA + SEED DATA
-- ============================================
