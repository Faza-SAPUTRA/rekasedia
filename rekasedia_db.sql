-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 25, 2026 at 03:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rekasedia_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'ATK', NULL),
(2, 'Kertas', NULL),
(3, 'Tinta & Toner', NULL),
(4, 'Peralatan Kelas', NULL),
(5, 'Elektronik', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category_id` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `unit` varchar(20) NOT NULL DEFAULT 'Unit',
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_loanable` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `category_id`, `stock`, `unit`, `description`, `image_url`, `is_loanable`, `created_at`, `updated_at`) VALUES
(1, 'Kertas HVS A4 80gsm', 2, 4, 'Rim', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(2, 'Spidol Boardmarker Hitam', 1, 120, 'Pcs', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(3, 'Spidol Boardmarker Merah', 1, 20, 'Pcs', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(4, 'Tinta Printer Epson L3110 Hitam', 3, 12, 'Botol', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(5, 'Proyektor Epson LCD K12', 5, 3, 'Unit', NULL, NULL, 1, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(6, 'Kabel HDMI 15 Meter', 5, 8, 'Pcs', NULL, NULL, 1, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(7, 'Speaker Aktif Portable JBL', 5, 2, 'Unit', NULL, NULL, 1, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(8, 'Penghapus Papan Tulis', 4, 45, 'Pcs', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(9, 'Kertas Folio F4 70gsm', 2, 2, 'Rim', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(10, 'Pulpen Gel Hitam', 1, 200, 'Pack', NULL, NULL, 0, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(11, 'Kabel Roll Terminal 10M', 5, 5, 'Unit', NULL, NULL, 1, '2026-04-13 13:10:41', '2026-04-13 13:10:41');

-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

CREATE TABLE `loans` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `borrower_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('DIPINJAM','DIKEMBALIKAN') NOT NULL DEFAULT 'DIPINJAM',
  `condition_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loans`
--

INSERT INTO `loans` (`id`, `item_id`, `borrower_id`, `borrow_date`, `due_date`, `return_date`, `status`, `condition_note`, `created_at`) VALUES
(1, 5, 2, '2025-11-18', '2025-11-18', NULL, 'DIKEMBALIKAN', NULL, '2026-04-13 13:10:41'),
(2, 7, 3, '2025-11-20', '2025-11-22', NULL, 'DIPINJAM', NULL, '2026-04-13 13:10:41'),
(3, 6, 4, '2025-11-21', '2026-04-14', NULL, 'DIPINJAM', NULL, '2026-04-13 13:10:41'),
(4, 5, 2, '2026-04-13', '2026-04-13', NULL, 'DIPINJAM', NULL, '2026-04-13 13:10:41'),
(5, 11, 3, '2025-11-10', '2025-11-11', NULL, '', NULL, '2026-04-13 13:10:41');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_reports`
--

CREATE TABLE `monthly_reports` (
  `id` int(11) NOT NULL,
  `semester` varchar(50) NOT NULL,
  `month_name` varchar(20) NOT NULL,
  `month_order` int(11) NOT NULL,
  `total_items_ordered` int(11) NOT NULL DEFAULT 0,
  `total_assets_borrowed` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monthly_reports`
--

INSERT INTO `monthly_reports` (`id`, `semester`, `month_name`, `month_order`, `total_items_ordered`, `total_assets_borrowed`) VALUES
(1, '', 'Juli', 7, 450, 20),
(2, '', 'Agustus', 8, 312, 15),
(3, '', 'September', 9, 620, 48),
(4, '', 'Oktober', 10, 410, 32),
(5, '', 'November', 11, 385, 29),
(6, '', 'Desember', 12, 120, 10),
(7, '', 'Januari', 1, 450, 22),
(8, '', 'Februari', 2, 320, 18),
(9, '', 'Maret', 3, 890, 60),
(10, '', 'April', 4, 210, 15);

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `id` int(11) NOT NULL,
  `req_code` varchar(20) NOT NULL,
  `item_id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `request_date` date NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('REGULER','URGENT') NOT NULL DEFAULT 'REGULER',
  `notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `requests`
--

INSERT INTO `requests` (`id`, `req_code`, `item_id`, `requester_id`, `quantity`, `request_date`, `status`, `priority`, `notes`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(1, 'REQ-202511-0001', 1, 2, 2, '2025-11-20', 'APPROVED', 'REGULER', NULL, NULL, NULL, '2026-04-13 13:10:41'),
(2, 'REQ-202511-0002', 2, 3, 5, '2025-11-21', 'PENDING', 'URGENT', NULL, NULL, NULL, '2026-04-13 13:10:41'),
(3, 'REQ-202511-0003', 10, 4, 2, '2025-11-19', 'REJECTED', 'REGULER', NULL, NULL, NULL, '2026-04-13 13:10:41'),
(4, 'REQ-202511-0004', 8, 2, 10, '2025-11-22', 'PENDING', 'REGULER', NULL, NULL, NULL, '2026-04-13 13:10:41');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','guru') NOT NULL DEFAULT 'guru',
  `department` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `department`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'Admin Sarpras', 'admin@rekasedia.sch.id', '$2b$10$bgb7u.vOcnOGRq3XPE6Cau90SPGQpoNqyHE4bP/DQauOVCeq44b4y', 'admin', 'Sarpras', NULL, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(2, 'Pak Bambang (Fisika)', 'bambang@rekasedia.sch.id', '$2b$10$bgb7u.vOcnOGRq3XPE6Cau90SPGQpoNqyHE4bP/DQauOVCeq44b4y', 'guru', 'Fisika', NULL, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(3, 'Ibu Sarah Putri (Biologi)', 'sarah@rekasedia.sch.id', '$2b$10$bgb7u.vOcnOGRq3XPE6Cau90SPGQpoNqyHE4bP/DQauOVCeq44b4y', 'guru', 'Biologi', NULL, '2026-04-13 13:10:41', '2026-04-13 13:10:41'),
(4, 'Bapak Budi Santoso (Matematika)', 'budi@rekasedia.sch.id', '$2b$10$bgb7u.vOcnOGRq3XPE6Cau90SPGQpoNqyHE4bP/DQauOVCeq44b4y', 'guru', 'Matematika', NULL, '2026-04-13 13:10:41', '2026-04-13 13:10:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `borrower_id` (`borrower_id`);

--
-- Indexes for table `monthly_reports`
--
ALTER TABLE `monthly_reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `req_code` (`req_code`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `loans`
--
ALTER TABLE `loans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `monthly_reports`
--
ALTER TABLE `monthly_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
