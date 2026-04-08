# 📦 RekaSedia — Sistem Manajemen Inventaris Sekolah

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**RekaSedia** adalah aplikasi web manajemen inventaris dan perlengkapan sekolah yang dirancang untuk memudahkan pengelolaan aset antara **Admin (Sarpras)** dan **Guru**. Dibangun dengan standar desain modern berbasis Figma, aplikasi ini menyediakan antarmuka yang bersih, responsif, dan intuitif untuk seluruh proses — mulai dari permintaan barang hingga pelacakan peminjaman.

---

## ✨ Fitur Utama

### 🔐 Autentikasi
- **Halaman Login** — Validasi form real-time, toggle visibilitas password, dan navigasi berbasis peran (Admin / Guru).
- **Halaman Registrasi** — Form multi-field dengan validasi ketat (nama, email, password, konfirmasi password, peran).

### 👨‍💼 Dashboard Admin (`/admin`)
| Modul | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan statistik (Total Barang, Peminjaman Aktif, Stok Kritis), tabel permintaan masuk terkini, dan daftar stok kritis. |
| **Inventaris** | Katalog barang bergaya kartu berwarna-warni dengan pencarian, filter kategori (ATK, Kertas, Elektronik, Kebersihan), pagination, dan keranjang permintaan interaktif. |
| **Permintaan** | Tabel manajemen permintaan dari guru dengan filter status (Menunggu, Disetujui, Ditolak) dan tombol aksi Setujui/Tolak per baris. |
| **Laporan** | Grafik distribusi kategori (Chart.js), statistik ringkasan, dan tabel log aktivitas lengkap. |

### 👩‍🏫 Dashboard Guru (`/teacher`)
| Modul | Deskripsi |
|---|---|
| **Dashboard** | Greeting personal ("Halo, Bapak/Ibu Guru! 👋"), stat cards (Sedang Dipinjam, Permintaan Diproses, Riwayat Ambil), dan grid akses cepat "Sering Dibutuhkan". |
| **Inventaris** | Katalog barang dengan tombol "Tambah ke Keranjang" / "Pinjam Barang", Cart Drawer overlay, dan modal konfirmasi "Tinjau Permintaan Anda" sebelum pengajuan. |
| **Peminjaman** | Daftar barang yang sedang dipinjam dengan indikator tenggat waktu dan tombol pengembalian. |
| **Laporan** | Ringkasan aktivitas personal guru. |

### 🛒 Sistem Keranjang (Cart Drawer)
- Slide-in drawer dari kanan dengan animasi **smooth** (masuk & keluar).
- Stepper kuantitas (+/−), hapus item, dan ringkasan total.
- Modal konfirmasi **"Tinjau Permintaan Anda"** menampilkan daftar item sebelum pengajuan final.
- Success modal setelah permintaan berhasil dikirim.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 |
| **Routing** | React Router DOM v7 |
| **Charting** | Chart.js + react-chartjs-2 |
| **Styling** | CSS Modules + CSS Variables (Design Tokens) |
| **Icons** | Font Awesome 6 |
| **Font** | Google Fonts (Inter) |

---

## 📁 Struktur Proyek

```
src/
├── components/            # Komponen UI reusable
│   ├── AuthLayout.tsx     # Layout halaman autentikasi
│   ├── BrandLogo.tsx      # Logo RekaSedia
│   ├── CartDrawer.tsx     # Overlay keranjang permintaan
│   ├── DashboardLayout.tsx # Layout dashboard admin
│   ├── InputField.tsx     # Input field dengan validasi
│   ├── Sidebar.tsx        # Sidebar navigasi admin
│   ├── TeacherLayout.tsx  # Layout dashboard guru
│   └── TeacherSidebar.tsx # Sidebar navigasi guru
├── data/
│   └── mockData.ts        # Data dummy untuk development
├── pages/
│   ├── LoginPage.tsx      # Halaman login
│   ├── RegisterPage.tsx   # Halaman registrasi
│   ├── admin/             # Halaman-halaman admin
│   │   ├── DashboardPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── LoansPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── RequestsPage.tsx
│   └── teacher/           # Halaman-halaman guru
│       ├── DashboardPage.tsx
│       ├── InventoryPage.tsx
│       ├── LoansPage.tsx
│       ├── ReportsPage.tsx
│       └── RequestsPage.tsx
├── styles/                # CSS Modules & global styles
│   ├── variables.css      # Design tokens (warna, radius, shadow)
│   ├── global.css         # Global styles & modal system
│   ├── auth.module.css    # Styling halaman autentikasi
│   ├── sidebar.module.css
│   ├── adminDashboard.module.css
│   ├── adminRequests.module.css
│   ├── inventory.module.css
│   ├── cartDrawer.module.css
│   ├── loans.module.css
│   ├── reports.module.css
│   ├── teacherDashboard.module.css
│   └── teacherRequests.module.css
├── App.tsx                # Root routing configuration
└── main.tsx               # Entry point
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Instalasi & Development
```bash
# Clone repository
git clone https://github.com/Faza-SAPUTRA/rekasedia.git

# Masuk ke direktori proyek
cd rekasedia

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173/`

### Build Production
```bash
npm run build
```

---

## 🎨 Design System

Aplikasi ini menggunakan **design tokens** terpusat yang didefinisikan di `variables.css`:

| Token | Contoh Penggunaan |
|---|---|
| `--sage-green` / `--sage-green-hover` | Warna utama (tombol, sidebar aktif, badge) |
| `--cream` / `--cream-dark` | Background halaman & elemen sekunder |
| `--dark-text` / `--medium-text` | Hierarki tipografi |
| `--error-red` | Badge stok kritis & validasi error |
| `--radius-sm` hingga `--radius-full` | Konsistensi border-radius |
| `--shadow-sm` hingga `--shadow-lg` | Elevasi & depth |

---

## 🗄️ Database

File `rekasedia_db.sql` sudah disertakan di root proyek untuk keperluan setup database MySQL di tahap integrasi backend.

---

## 📌 Roadmap

- [x] UI Autentikasi (Login & Register)
- [x] Dashboard Admin (Statistik, Inventaris, Laporan)
- [x] Dashboard Guru (Permintaan, Peminjaman, Katalog)
- [x] Sistem Keranjang & Modal Konfirmasi
- [x] Halaman Permintaan Admin (Approve/Reject)
- [ ] Integrasi Backend API (MySQL)
- [ ] Autentikasi JWT & Role-Based Redirect
- [ ] Notifikasi Real-time
- [ ] Export Laporan (PDF/Excel)

---

## 👥 Tim

Dikembangkan sebagai bagian dari tugas mata kuliah **Dasar UI/UX** — Desain antarmuka berdasarkan prototipe Figma.

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademis.
