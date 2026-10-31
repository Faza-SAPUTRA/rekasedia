# 🚧 RekaSedia: To-Do List & Status Implementasi Arsitektur

Dokumen ini memuat daftar tugas pengembangan (*coding*) yang **belum terimplementasi** di dalam repositori berdasarkan *Software Architecture Design Document* (SADD) versi 1.0. Fokus utama pengembangan saat ini berada pada lapisan logika bisnis (*Controller*) di Vercel, struktur pangkalan data di Supabase, dan integrasi antarmuka React.

## 1. Integrasi Layanan Notifikasi (Telegram Bot API)
Arsitektur SOA (REST) mengamanatkan sistem untuk mengirimkan notifikasi otomatis secara *real-time*.
- [x] **Setup Bot Telegram:** Buat bot via BotFather dan simpan `BOT_TOKEN` ke dalam *Environment Variables* (`.env`) di Vercel. *(placeholder di `.env`, graceful degradation jika kosong)*
- [x] **Pembuatan Webhook Adapter:** `server/services/telegram.js` — adapter `sendTelegramMessage()` dengan HTML parse mode.
- [x] **Trigger Notifikasi Event:** Sisipkan pemanggilan fungsi notifikasi ketika terjadi kejadian (*event*) berikut:
  - Permintaan ATK baru diajukan oleh Guru (Notifikasi ke Admin). ✅ `notifyNewRequest()`
  - Permintaan ATK di-*Approve* / di-*Reject* (Notifikasi ke Guru pemohon). ✅ `notifyRequestApproved()` / `notifyRequestRejected()`
  - Peringatan 24 jam sebelum batas waktu pengembalian aset (*due date*). ✅ `notifyLoanDueReminder()` + endpoint `GET /api/loans/due-reminders`

## 2. Logika Reservasi & Deteksi Jadwal Bentrok (*Booking System*)
Peminjaman aset (seperti proyektor/laptop) belum memiliki algoritma pencegahan tumpang tindih (*overlapping*).
- [x] **Overlapping Schedule Validator:** `server/routes/loans.js` — query `COUNT(*) WHERE borrow_date <= $due AND due_date >= $borrow` dibandingkan dengan stok (`item.stock`). Jika overlap >= stock → reject 409.
- [x] **State UI Kalender (Frontend):** `src/pages/admin/LoansPage.tsx` — modal booking baru dengan fetch availability (`GET /api/loans/availability?item_id=X`) dan visualisasi jadwal aktif + form date-picker.

## 3. Sistem Rekam Jejak Otomatis (*Audit Trail*)
Setiap perubahan data (CRUD) harus dicatat secara transparan untuk memenuhi kebutuhan akuntabilitas Sarpras.
- [x] **Skema Tabel `audit_logs`:** `server/migrations/003_create_audit_logs.sql` — tabel *append-only* + `audit_trigger_fn()` trigger PostgreSQL.
- [x] **Implementasi Command Pattern (Backend):** `server/services/auditLogger.js` (`logAudit()` helper). Digunakan di `items.js`, `requests.js`, `loans.js`.
- [x] **Database Triggers:** SQL Trigger `audit_trigger_fn` otomatis pada tabel `items`, `requests`, dan `loans`.
- [x] **Frontend Audit Log:** `src/pages/admin/AuditLogPage.tsx` — halaman admin dengan tabel, filter, pagination, dan statistik. Route: `/admin/audit`.

## 4. Keamanan Berlapis (JWT & RBAC)
Pengamanan sesi lintas peran (Admin vs Guru) belum sepenuhnya terkunci di lapisan *routing* maupun *database*.
- [x] **JWT Middleware (Vercel):** `server/middleware/auth.js` — `authenticateToken` + `requireCompletedPasswordChange`.
- [x] **React Route Guards:** `src/components/ProtectedRoute.tsx` — mengecek role `admin`/`guru` dan redirect.
- [x] **Row-Level Security (RLS) di Supabase:** `server/migrations/004_enable_rls_policies.sql` — 19 policies aktif. Admin full access, Guru read-only items & hanya data milik sendiri di requests/loans. Helper `setRLSContext()` di `db.js`.
- [x] **Admin-Assisted Password Reset:** `server/routes/auth.js` — endpoint `/api/auth/forgot-password`, `/api/auth/password-reset-requests`, kode RST-xxxxxx dengan TTL 30 menit.

## 5. Transaksi Atomik untuk Stok (Database)
- [x] **Pencegahan Stok Negatif:** `server/routes/requests.js` — `UPDATE items SET stock = stock - $qty WHERE id = $id AND stock >= $qty`. Jika `rowCount === 0` → return 400 "Stok tidak mencukupi".

---

### 📌 Ringkasan Status
| Modul | Status |
|-------|--------|
| 1. Telegram Notification | ✅ Selesai |
| 2. Booking System + Overlap Validator | ✅ Selesai |
| 3. Audit Trail | ✅ Selesai |
| 4. JWT & RBAC | ✅ Selesai (19 RLS policies) |
| 5. Transaksi Atomik Stok | ✅ Selesai |
