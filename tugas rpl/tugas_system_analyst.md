# Tugas System Analyst — RekaSedia

**Tim RPL**: REKASEDIA
**Instansi**: SDN Kademangan 01

---

## 1. Executive Summary

Pada proyek ini akan dirancang sebuah sistem yaitu **RekaSedia** yang merupakan sebuah Sistem Informasi Manajemen Inventaris Sekolah yang bertujuan untuk mendigitalisasi seluruh alur pengelolaan sarana dan prasarana (Sarpras) di lingkungan SDN Kademangan 01. Sistem ini mencakup proses permintaan Alat Tulis Kantor (ATK), peminjaman aset sekolah, validasi permintaan oleh admin, hingga pelaporan penggunaan inventaris secara real-time. RekaSedia hadir sebagai solusi atas permasalahan pencatatan sirkulasi barang yang masih manual, sehingga pengelola kesulitan melacak siapa yang sedang meminjam barang dan membutuhkan waktu lama untuk menyusun laporan aset.

Pengerjaan proyek sistem informasi ini dilakukan sesuai dengan metodologi **System Development Life Cycle (SDLC)**, yaitu metodologi **Agile (Evolutionary/Incremental)**. Model ini dipilih karena proyek ini merupakan pengembangan dari sistem (UI) yang sudah ada. Model Evolutionary/Incremental memungkinkan tim untuk menambahkan fitur-fitur kompleks — seperti Sistem Reservasi (Booking) Terjadwal, Sistem Rekam Jejak (Audit Trail), dan Integrasi API Pesan Singkat (WhatsApp/Telegram) — secara bertahap (iteratif) ke dalam core aplikasi tanpa merusak sistem yang sudah berjalan, serta dapat mengakomodasi perubahan requirement dengan lebih fleksibel.

---

## 2. System Request

Untuk memastikan bahwa proyek ini dapat memenuhi kebutuhan bisnis organisasi, telah diusulkan sebuah System Request kepada Project Sponsor yang di dalamnya berisi informasi mengenai Project Sponsor, Business Needs, Business Requirements, Business Values, dan Special Issues/Constraints.

### 2.1. Project Sponsor

Project Sponsor pada pengembangan sistem informasi ini adalah sebagai berikut:

| Field | Keterangan |
| --- | --- |
| **Nama** | *(diisi sesuai data sekolah)* |
| **Jabatan** | Kepala Sekolah SDN Kademangan 01 |
| **No. HP** | *(diisi sesuai data sekolah)* |
| **E-Mail** | *(diisi sesuai data sekolah)* |
| **Alamat** | SDN Kademangan 01, Kademangan |

### 2.2. Business Needs

Berdasarkan hasil analisis kondisi di SDN Kademangan 01, ditemukan beberapa permasalahan utama dalam pengelolaan sarana dan prasarana sekolah:

1. **Pencatatan manual yang tidak efisien** — Seluruh proses pencatatan sirkulasi barang (permintaan ATK, peminjaman aset) masih dilakukan secara manual menggunakan buku catatan atau spreadsheet sederhana, sehingga rentan terhadap kesalahan pencatatan dan kehilangan data.
2. **Kesulitan melacak status peminjaman** — Pengelola Sarpras kesulitan mengetahui secara real-time siapa yang sedang meminjam barang, kapan batas waktu pengembalian, dan barang apa saja yang sedang tersedia.
3. **Penyusunan laporan yang memakan waktu** — Proses penyusunan laporan aset membutuhkan waktu lama karena harus merekap data dari berbagai sumber manual yang tersebar.
4. **Tidak ada sistem pencegahan bentrok peminjaman** — Dua guru atau lebih dapat mengajukan peminjaman untuk barang yang sama pada waktu bersamaan tanpa ada mekanisme pengecekan ketersediaan otomatis.
5. **Ketiadaan jejak audit** — Tidak ada rekam jejak perubahan data yang terdokumentasi, sehingga sulit untuk mempertanggungjawabkan mutasi barang.
6. **Keterlambatan informasi** — Guru dan staf tidak mendapat notifikasi otomatis terkait status permintaan, jadwal pengembalian, atau persetujuan admin.

### 2.3. Business Requirements

Kebutuhan bisnis pada pengembangan sistem informasi ini terdiri dari kebutuhan non-fungsional dan kebutuhan fungsional.

**Kebutuhan Non-Fungsional:**

1. Sistem harus dapat diakses melalui web browser (desktop dan mobile) tanpa perlu instalasi perangkat lunak tambahan.
2. Sistem harus memiliki waktu respons halaman kurang dari 3 detik untuk operasi standar.
3. Sistem harus menyimpan data secara aman menggunakan enkripsi password (bcrypt) dan autentikasi berbasis token (JWT).
4. Sistem harus memiliki antarmuka yang intuitif dan mudah digunakan oleh guru maupun admin tanpa pelatihan khusus.
5. Sistem harus mampu menangani minimal 50 pengguna secara bersamaan (seluruh staf sekolah).
6. Sistem harus tersedia 24/7 dengan uptime minimal 99%.

**Kebutuhan Fungsional:**

1. Sistem harus mampu mengelola data inventaris barang (CRUD) beserta kategorisasi dan indikator stok otomatis.
2. Sistem harus menyediakan fitur permintaan barang ATK dengan mekanisme keranjang belanja (*shopping cart*) untuk guru.
3. Sistem harus menyediakan alur validasi permintaan oleh admin (approve/reject) secara real-time.
4. Sistem harus mampu mengelola peminjaman aset sekolah (pencatatan pinjam, monitoring, dan pengembalian).
5. Sistem harus menyediakan dashboard visual dengan grafik laporan penggunaan barang per bulan/semester.
6. Sistem harus menyediakan fitur login multi-role (Admin Sarpras dan Guru) dengan autentikasi NIP/email.
7. Sistem harus menyediakan fitur reset password yang diasistensi oleh admin sekolah.
8. Sistem harus mampu mengimpor data guru dari file CSV secara batch.
9. *(Fitur baru)* Sistem harus menyediakan **Sistem Reservasi (Booking) Terjadwal** untuk mencegah bentrok peminjaman aset.
10. *(Fitur baru)* Sistem harus menyediakan **Sistem Rekam Jejak (Audit Trail)** untuk mencatat seluruh perubahan data secara otomatis demi keamanan dan akuntabilitas.
11. *(Fitur baru)* Sistem harus menyediakan **Integrasi API Pesan Singkat** (WhatsApp/Telegram) untuk notifikasi otomatis terkait status permintaan, jadwal pengembalian, dan sirkulasi barang.

### 2.4. Business Value

Adapun nilai bisnis yang dapat diperoleh dengan adanya sistem RekaSedia ini diuraikan menjadi 2 poin, yaitu tangible dan intangible.

**Tangible:**

1. **Pengurangan waktu penyusunan laporan aset** dari rata-rata 2–3 hari kerja per bulan menjadi instan (otomatis ter-generate oleh dashboard sistem).
2. **Penghematan biaya operasional** karena tidak lagi membutuhkan kertas, buku catatan, dan formulir fisik untuk pencatatan sirkulasi barang.
3. **Pengurangan kehilangan/kerusakan aset** karena seluruh peminjaman tercatat dan terlacak secara digital, sehingga aset yang belum dikembalikan dapat segera ditindaklanjuti.
4. **Efisiensi waktu proses permintaan ATK** dari rata-rata 1–2 hari (menunggu pertemuan langsung dengan admin) menjadi kurang dari 1 jam (validasi online real-time).
5. **Pencegahan pembelian ganda** karena stok barang transparan dan selalu ter-update, sehingga anggaran belanja inventaris lebih akurat.

**Intangible:**

1. **Peningkatan transparansi dan akuntabilitas** dalam pengelolaan aset sekolah, yang mendukung prinsip tata kelola yang baik (*good governance*).
2. **Peningkatan kepuasan guru dan staf** karena proses permintaan barang menjadi lebih cepat, mudah, dan dapat dipantau statusnya kapan saja.
3. **Peningkatan citra profesionalisme sekolah** di mata stakeholder (Dinas Pendidikan, orang tua murid, komite sekolah) karena sudah mengadopsi sistem informasi digital.
4. **Kemudahan pengambilan keputusan** bagi manajemen sekolah karena data penggunaan inventaris tersedia dalam bentuk visualisasi grafik yang mudah dibaca.
5. **Perlindungan data melalui audit trail** yang memberikan rasa aman dan kepercayaan terhadap integritas data.

### 2.5. Special Issues / Constraints

Special issue atau constraint yang dihadapi dalam pengembangan sistem informasi ini adalah:

1. **Keterbatasan infrastruktur sekolah** — Koneksi internet di lingkungan SDN Kademangan 01 belum sepenuhnya stabil, sehingga sistem harus dioptimalkan agar tetap responsif pada bandwidth rendah.
2. **Literasi digital pengguna** — Sebagian guru dan staf sekolah memiliki tingkat literasi digital yang beragam, sehingga antarmuka harus dirancang sesederhana dan se-intuitif mungkin.
3. **Email guru bukan email aktif** — Alamat email guru pada data sekolah bukan email yang aktif digunakan sehari-hari, sehingga fitur reset password tidak bisa mengandalkan email verification dan harus menggunakan alur admin-assisted reset.
4. **Tidak ada anggaran untuk perangkat keras tambahan** — Solusi notifikasi harus berbasis API pihak ketiga (WhatsApp/Telegram) tanpa memerlukan pembelian server SMS gateway atau perangkat keras tambahan.
5. **Keamanan data sensitif** — Data inventaris dan data pribadi guru (NIP, email) harus dilindungi sesuai standar keamanan minimal (password hashing, JWT authentication, HTTPS).
6. **Pengembangan bertahap** — Karena sistem sudah memiliki basis UI yang berjalan, fitur baru (Booking, Audit Trail, Notifikasi API) harus ditambahkan secara iteratif tanpa mengganggu fungsionalitas yang sudah ada.

---

## 3. Requirement Definitions

### 3.1. Nonfunctional Requirements

**a) Operational Requirements:**
- Sistem harus dapat berjalan pada web browser modern (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari) versi terbaru.
- Sistem harus dapat diakses melalui perangkat desktop, laptop, tablet, maupun smartphone (responsive design).
- Sistem harus mendukung dua role pengguna secara bersamaan: Admin Sarpras dan Guru.
- Sistem harus dapat dioperasikan tanpa instalasi aplikasi tambahan di sisi client (cukup browser).
- Sistem backend harus berjalan pada server Node.js dengan koneksi ke database PostgreSQL (Supabase).

**b) Performance Requirements:**
- Waktu muat halaman (page load time) tidak boleh melebihi 3 detik pada koneksi internet standar (minimal 5 Mbps).
- Proses login dan autentikasi harus selesai dalam waktu kurang dari 2 detik.
- Proses pencarian dan filter inventaris harus menampilkan hasil dalam waktu kurang dari 1 detik.
- Dashboard dan grafik laporan harus ter-render dalam waktu kurang dari 3 detik.
- Sistem harus mampu menangani minimal 50 pengguna aktif secara bersamaan tanpa penurunan performa yang signifikan.

**c) Reliability Requirements:**
- Sistem harus memiliki uptime minimal 99% per bulan.
- Data transaksi (permintaan, peminjaman, pengembalian) tidak boleh hilang meskipun terjadi gangguan koneksi sementara — sistem harus memberikan notifikasi error yang jelas kepada pengguna.
- Sistem harus mampu melakukan recovery otomatis setelah server restart tanpa kehilangan data yang sudah tersimpan di database.
- Backup database harus dilakukan secara otomatis oleh penyedia layanan (Supabase) dengan retensi minimal 7 hari.

**d) Safety Requirements:**
- Sistem tidak boleh memproses penghapusan data inventaris secara permanen tanpa konfirmasi berlapis (modal konfirmasi).
- Sistem harus mencegah pengurangan stok di bawah nol (validasi server-side).
- Sistem harus memberikan peringatan visual (warning) ketika stok barang mendekati batas minimum (stok kritis).
- Seluruh operasi penghapusan dan perubahan data harus tercatat dalam audit trail.

**e) Security Requirements:**
- Password pengguna harus disimpan menggunakan algoritma hashing bcrypt, bukan plaintext.
- Autentikasi pengguna menggunakan JSON Web Token (JWT) dengan masa berlaku terbatas.
- Setiap endpoint API backend harus dilindungi oleh middleware autentikasi yang memvalidasi token.
- Password sementara hasil reset harus memiliki masa berlaku maksimal 30 menit.
- Pengguna yang login dengan password sementara wajib mengganti password sebelum mengakses fitur lain (enforced change-password).
- Route frontend dilindungi oleh ProtectedRoute (role-based) dan GuestRoute (mencegah user aktif kembali ke halaman auth).
- File data sensitif (`.env`, data CSV guru) harus diabaikan oleh version control (`.gitignore`).

**f) Usability Requirements:**
- Antarmuka harus menggunakan bahasa Indonesia sebagai bahasa utama agar mudah dipahami oleh seluruh staf sekolah.
- Navigasi sistem harus menggunakan sidebar yang konsisten untuk setiap role (Admin dan Guru).
- Setiap aksi penting (approve, reject, hapus, kirim permintaan) harus disertai modal konfirmasi untuk mencegah kesalahan.
- Sistem harus menyediakan indikator loading (skeleton screen) saat data sedang dimuat agar pengguna mengetahui bahwa proses sedang berjalan.
- Formulir input harus memiliki validasi real-time dengan pesan error yang jelas dan mudah dipahami.
- Katalog inventaris harus mendukung grid responsif (menyesuaikan jumlah kolom sesuai ukuran layar: 6, 4, 3, 2, hingga 1 kolom).
- Dropdown filter dan elemen interaktif lainnya harus bebas dari overflow horizontal (teks tidak terpotong).

### 3.2. Functional Requirements

Sistem informasi yang dibangun memiliki kebutuhan fungsional sebagai berikut:

**a) Manajemen Autentikasi dan Pengguna**
- Sistem harus menyediakan halaman login yang mendukung NIP atau email sebagai kredensial.
- Sistem harus menyediakan halaman registrasi untuk pendaftaran akun guru baru.
- Sistem harus menyediakan fitur lupa password dengan alur admin-assisted reset (kode verifikasi RST-xxxxxx).
- Sistem harus mewajibkan penggantian password bagi pengguna yang login menggunakan password sementara.
- Sistem harus mengarahkan pengguna ke dashboard sesuai role (admin → /admin, guru → /teacher) setelah login berhasil.
- Sistem harus mencegah pengguna yang sudah login untuk kembali mengakses halaman login/register/forgot-password.
- Sistem harus mampu mengimpor data guru secara batch dari file CSV (upsert berdasarkan NIP/email).

**b) Manajemen Inventaris**
- Sistem harus menampilkan katalog inventaris dengan kategorisasi (ATK, Kertas, Tinta & Toner, Peralatan Kelas, Elektronik, Furnitur).
- Sistem harus menyediakan indikator stok otomatis dengan peringatan visual untuk stok kritis.
- Sistem harus mendukung pengelolaan data barang (tambah, edit, hapus) oleh admin.
- Sistem harus membedakan barang habis pakai dan barang yang dapat dipinjam (is_loanable).
- Sistem harus menyediakan fitur filter dan pencarian barang berdasarkan kategori dan nama.

**c) Sistem Permintaan Barang (Request)**
- Sistem harus menyediakan mekanisme keranjang belanja (cart) yang memungkinkan guru meminta banyak barang sekaligus dalam satu pengajuan.
- Sistem harus menghasilkan kode permintaan unik (REQ-YYYYMM-XXXX) untuk setiap pengajuan.
- Sistem harus menyediakan pilihan prioritas permintaan (Reguler atau Urgent).
- Sistem harus menampilkan halaman status pesanan bagi guru (Pending, Approved, Rejected).
- Sistem harus menyediakan halaman validasi permintaan bagi admin dengan opsi approve atau reject.
- Sistem harus mengurangi stok barang secara otomatis ketika permintaan disetujui.

**d) Sistem Peminjaman Aset (Loan)**
- Sistem harus mencatat data peminjaman aset (item, peminjam, tanggal pinjam, tanggal jatuh tempo).
- Sistem harus menampilkan daftar peminjaman aktif (status DIPINJAM) dan riwayat pengembalian (status DIKEMBALIKAN).
- Sistem harus menyediakan fitur pencatatan pengembalian aset dengan catatan kondisi barang.

**e) Dashboard dan Laporan**
- Sistem harus menyediakan dashboard admin yang menampilkan ringkasan: total inventaris, permintaan terbaru, stok kritis, antrean persetujuan akun, dan antrean reset password.
- Sistem harus menyediakan dashboard guru yang menampilkan ringkasan permintaan dan peminjaman aktif.
- Sistem harus menyediakan halaman laporan dengan visualisasi grafik (Chart.js) penggunaan barang per bulan dan per semester.
- Sistem harus menampilkan tanggal dalam format Indonesia (contoh: "20 Juni").

**f) Fitur Baru yang Direncanakan**
- Sistem Reservasi (Booking) Terjadwal: fitur penjadwalan peminjaman aset dengan pengecekan ketersediaan otomatis untuk mencegah bentrok.
- Sistem Rekam Jejak (Audit Trail): pencatatan otomatis seluruh perubahan data (siapa, kapan, apa yang diubah) untuk keamanan dan akuntabilitas.
- Integrasi API Pesan Singkat (WhatsApp/Telegram): notifikasi otomatis ke guru terkait status permintaan, pengingat jadwal pengembalian, dan informasi sirkulasi barang.
