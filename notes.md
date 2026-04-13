# Catatan Materi Presentasi: Proyek RekaSedia

> [!TIP]
> **Akses Demo (Login)**:
> - **Admin**: Ketik `admin` (Password bebas)
> - **Guru**: Ketik `guru` (Password bebas)

## 1. Tahap Empathize & Define (Memahami Masalah)
Proyek ini bermula dari keresahan manajemen sarana dan prasarana (Sarpras) di sekolah:
- **Masalah**: Proses permintaan alat tulis kantor (ATK) dan peminjaman aset seringkali tidak tercatat dengan rapi, masih manual, dan sulit dipantau progresnya.
- **Kebutuhan**: Guru butuh kemudahan buat minta barang tanpa ribet birokrasi, dan Admin Sarpras butuh kontrol penuh atas stok barang agar tidak terjadi kekosongan mendadak.

## 2. Tahap Ideate (Solusi yang Ditawarkan)
RekaSedia dirancang sebagai platform satu pintu untuk menjawab kebutuhan tersebut melalui dua pintu masuk utama:
- **Pintu Guru (User)**: Fokus pada kenyamanan memilih barang lewat katalog digital yang modern.
- **Pintu Admin Sarpras**: Fokus pada akurasi data, validasi cepat, dan laporan otomatis.

## 3. Fitur Utama & Nilai Solusi (Value Proposition)
Saat ini, RekaSedia sudah memiliki fitur-fitur krusial:
- **Katalog Inventaris Modern**: Tampilan barang yang intuitif dengan sistem filter kategori dan indikator stok otomatis (stok menipis dapet warning visual).
- **Sistem Permintaan 'Keranjang'**: Memungkinkan Guru meminta banyak barang sekaligus dalam satu kali pengajuan (lebih efisien dibanding sistem per-item).
- **Alur Validasi Interaktif**: Admin bisa menyetujui atau menolak permintaan secara real-time, yang langsung memberikan notifikasi status ke pihak Guru.
- **Dashboard Visual (Data Visualization)**: Ringkasan statistik penggunaan barang per bulan dalam bentuk grafik, memudahkan sekolah dalam merencanakan anggaran belanja inventaris semester depan.

## 4. Status Progres & Tahap Prototype
Sejauh ini, pengembangan telah mencapai tahap **High-Fidelity Prototype**:
- **UI/UX Selesai**: Antarmuka sudah didesain sangat premium, responsif, dan mudah operasikan (user-friendly).
- **Alur Bisnis Berjalan**: Seluruh skenario utama (Login -> Pilih Barang -> Ajukan Permintaan -> Validasi Admin -> Cek Laporan) sudah berfungsi secara utuh.
- **Kesiapan Presentasi**: Sistem sudah dalam kondisi siap tampil (presentation-ready) dengan data sampel yang merefleksikan kondisi nyata di sekolah.

## 5. Cakupan Desain (Visual Progress)
Desain antarmuka (UI) RekaSedia sudah mencakup seluruh perjalanan pengguna (*user journey*) secara komprehensif, meliputi:
- **Akses & Keamanan**: Halaman Login dan Registrasi Akun.
- **Pusat Navigasi**: Dashboard Utama untuk Admin dan Guru.
- **Katalog & Transaksi**: Katalog Inventaris, Keranjang Belanja (_Shopping Cart_), hingga Formulir Checkout Permintaan.
- **Monitoring & Validasi**: Halaman Status Pesanan (Requests) dan Pengelolaan Peminjaman Aset (Active Loans).
- **Interaksi Pengguna**: Berbagai modal konfirmasi (Batal, Pengembalian, dan Sukses) untuk pengalaman yang lebih interaktif.
- **Analitik**: Halaman Laporan (Reports) dengan visualisasi grafik penggunaan.

## 6. Langkah Selanjutnya (Output yang Diharapkan)
Langkah berikutnya adalah finalisasi sistem keamanan data dan optimasi performa untuk skala pengguna yang lebih luas (seluruh staf sekolah), serta integrasi database permanen setelah masa presentasi mockup selesai.
