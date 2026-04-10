-- ==========================================================
-- RekaSedia Dummy Data Seeder
-- Silahkan buka phpMyAdmin Anda, pilih database rekasedia_db, 
-- lalu pada tab "Import", pilih dan masukkan file SQL ini.
-- ==========================================================

-- Gunakan database
USE `rekasedia_db`;

-- Set zona waktu
SET time_zone = "+00:00";

-- Matikan cek foreign key sementara agar mudah insert data
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Kosongkan tabel (Hati-Hati, pastikan ini database testing)
DELETE FROM `monthly_reports`;
DELETE FROM `loans`;
DELETE FROM `requests`;
DELETE FROM `items`;
DELETE FROM `categories`;
DELETE FROM `users`;

ALTER TABLE `monthly_reports` AUTO_INCREMENT = 1;
ALTER TABLE `loans` AUTO_INCREMENT = 1;
ALTER TABLE `requests` AUTO_INCREMENT = 1;
ALTER TABLE `items` AUTO_INCREMENT = 1;
ALTER TABLE `categories` AUTO_INCREMENT = 1;
ALTER TABLE `users` AUTO_INCREMENT = 1;

-- 2. Insert Kategori
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'ATK'),
(2, 'Kertas'),
(3, 'Tinta & Toner'),
(4, 'Peralatan Kelas'),
(5, 'Elektronik');

-- 3. Insert Users (Password semua adalah 'password123' yang sudah di-hash bcrypt)
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `department`) VALUES
(1, 'Admin Sarpras', 'admin@rekasedia.sch.id', '$2b$10$YourHashedPasswordHere', 'admin', 'Sarpras'),
(2, 'Pak Bambang (Fisika)', 'bambang@rekasedia.sch.id', '$2b$10$YourHashedPasswordHere', 'guru', 'Fisika'),
(3, 'Ibu Sarah Putri (Biologi)', 'sarah@rekasedia.sch.id', '$2b$10$YourHashedPasswordHere', 'guru', 'Biologi'),
(4, 'Bapak Budi Santoso (Matematika)', 'budi@rekasedia.sch.id', '$2b$10$YourHashedPasswordHere', 'guru', 'Matematika');

-- 4. Insert Items
INSERT INTO `items` (`id`, `category_id`, `name`, `stock`, `unit`, `is_loanable`) VALUES
(1, 2, 'Kertas HVS A4 80gsm', 4, 'Rim', 0),
(2, 1, 'Spidol Boardmarker Hitam', 120, 'Pcs', 0),
(3, 1, 'Spidol Boardmarker Merah', 20, 'Pcs', 0),
(4, 3, 'Tinta Printer Epson L3110 Hitam', 12, 'Botol', 0),
(5, 5, 'Proyektor Epson LCD K12', 3, 'Unit', 1),
(6, 5, 'Kabel HDMI 15 Meter', 8, 'Pcs', 1),
(7, 5, 'Speaker Aktif Portable JBL', 2, 'Unit', 1),
(8, 4, 'Penghapus Papan Tulis', 45, 'Pcs', 0),
(9, 2, 'Kertas Folio F4 70gsm', 2, 'Rim', 0),
(10, 1, 'Pulpen Gel Hitam', 200, 'Pack', 0),
(11, 5, 'Kabel Roll Terminal 10M', 5, 'Unit', 1);

-- 5. Insert Requests (Permintaan Barang)
INSERT INTO `requests` (`id`, `requester_id`, `item_id`, `quantity`, `req_code`, `status`, `priority`, `request_date`) VALUES
(1, 2, 1, 2, 'REQ-202511-0001', 'APPROVED', 'REGULER', '2025-11-20'),
(2, 3, 2, 5, 'REQ-202511-0002', 'PENDING', 'URGENT', '2025-11-21'),
(3, 4, 10, 2, 'REQ-202511-0003', 'REJECTED', 'REGULER', '2025-11-19'),
(4, 2, 8, 10, 'REQ-202511-0004', 'PENDING', 'REGULER', '2025-11-22');

-- 6. Insert Loans (Peminjaman Aset)
INSERT INTO `loans` (`id`, `borrower_id`, `item_id`, `borrow_date`, `due_date`, `status`) VALUES
(1, 2, 5, '2025-11-18', '2025-11-18', 'DIKEMBALIKAN'), -- Proyektor (Selesai)
(2, 3, 7, '2025-11-20', '2025-11-22', 'DIPINJAM'),     -- Speaker (Sedang Dipinjam)
(3, 4, 6, '2025-11-21', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'DIPINJAM'),     -- Kabel HDMI (Jatuh Tempo Besok)
(4, 2, 5, CURDATE(), CURDATE(), 'DIPINJAM'), -- Proyektor (Dipinjam Hari Ini, Jatuh Tempo Hari Ini)
(5, 3, 11, '2025-11-10', '2025-11-11', 'TERLAMBAT');  -- Kabel Roll (Menunggak)

-- 7. Insert Monthly Reports Terkumpul (Untuk Chart Dashboard/Reports)
INSERT INTO `monthly_reports` (`month_order`, `month_name`, `total_items_ordered`, `total_assets_borrowed`) VALUES
(7, 'Juli', 450, 20),
(8, 'Agustus', 312, 15),
(9, 'September', 620, 48), -- Tengah Semeter 1
(10, 'Oktober', 410, 32),
(11, 'November', 385, 29),
(12, 'Desember', 120, 10), -- Libur
(1, 'Januari', 450, 22),
(2, 'Februari', 320, 18),
(3, 'Maret', 890, 60),     -- Ujian Sekolah
(4, 'April', 210, 15);

-- Nyalakan lagi cek id foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- SELESAI. Semua Data Berhasil Dimasukkan
-- ==========================================================
