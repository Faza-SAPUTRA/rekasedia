# RekaSedia

<p align="center">
  <strong>Aplikasi inventaris sekolah untuk alur Sarpras yang lebih rapi, cepat, dan mudah dipantau.</strong>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0B1220">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Mock Mode" src="https://img.shields.io/badge/Data-Mock_Mode-00A86B?style=for-the-badge">
</p>

<p align="center">
  <a href="#tampilan-aplikasi">Tampilan</a> |
  <a href="#akun-demo">Akun Demo</a> |
  <a href="#cara-menjalankan">Cara Menjalankan</a> |
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Tentang Project

RekaSedia adalah aplikasi inventaris sekolah untuk membantu admin Sarpras dan guru mengelola kebutuhan barang harian. Aplikasi ini mencakup alur melihat stok, mengajukan permintaan, memvalidasi permintaan, sampai memantau peminjaman aset.

Versi saat ini difokuskan untuk kebutuhan demo dan testing menggunakan data dummy. Artinya, aplikasi bisa langsung dicoba tanpa setup database atau backend terlebih dahulu.

<table>
  <tr>
    <td><strong>Mode</strong></td>
    <td>Demo dengan mock API</td>
  </tr>
  <tr>
    <td><strong>Target pengguna</strong></td>
    <td>Admin Sarpras dan guru</td>
  </tr>
  <tr>
    <td><strong>Penyimpanan demo</strong></td>
    <td><code>sessionStorage</code> browser</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>Opsional, belum dibutuhkan untuk demo saat ini</td>
  </tr>
</table>

## Tampilan Aplikasi

Beberapa tampilan berikut mewakili alur utama RekaSedia: user masuk, guru mengajukan barang, lalu admin memantau dan memproses permintaan.

### Login

Halaman awal untuk masuk sebagai admin atau guru. Di mode dummy, gunakan email demo yang tersedia.

![Halaman login RekaSedia](docs/images/login.png)

### Dashboard Admin

Admin bisa melihat kondisi inventaris secara cepat, termasuk permintaan terbaru, stok kritis, dan ringkasan aktivitas.

![Dashboard admin RekaSedia](docs/images/admin-dashboard.png)

### Katalog Guru dan Keranjang

Guru memilih barang dari katalog, memasukkannya ke keranjang, lalu mengirim permintaan untuk divalidasi admin.

![Katalog inventaris guru dengan keranjang](docs/images/teacher-inventory-cart.png)

### Status Pesanan Guru

Setelah permintaan dikirim, guru bisa memantau apakah pesanan masih menunggu validasi, disetujui, atau ditolak.

![Halaman pesanan guru](docs/images/teacher-requests.png)

## Yang Bisa Dicoba

<table>
  <thead>
    <tr>
      <th>Peran</th>
      <th>Fungsi Utama</th>
      <th>Area yang Bisa Dicoba</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Admin</strong></td>
      <td>Mengawasi inventaris dan memvalidasi permintaan barang.</td>
      <td>Dashboard, inventaris, validasi permintaan, laporan.</td>
    </tr>
    <tr>
      <td><strong>Guru</strong></td>
      <td>Mengajukan kebutuhan barang dan memantau status permintaan.</td>
      <td>Katalog barang, keranjang, pesanan, peminjaman.</td>
    </tr>
  </tbody>
</table>

Alur dummy-nya sudah saling terhubung:

- Guru membuat permintaan dari katalog.
- Permintaan muncul di dashboard dan halaman validasi admin.
- Admin menyetujui atau menolak permintaan.
- Kalau disetujui, stok barang dummy ikut berkurang.
- Dashboard admin dan guru membaca data dummy yang sama selama sesi browser masih aktif.

## Mode Data Dummy

Saat ini aplikasi berjalan dalam mock mode lewat:

```text
src/services/api.ts
```

Data awalnya berasal dari:

```text
src/data/mockData.ts
```

Perubahan saat testing disimpan sementara di `sessionStorage`, bukan database.

| Kondisi | Perilaku |
| --- | --- |
| Tab browser masih aktif | Perubahan dummy tetap tersimpan. |
| Tab atau browser ditutup | Data kembali ke dummy default. |
| Ingin mengulang demo | Cukup buka ulang sesi browser baru. |

Mode ini sengaja dibuat ringan supaya demo bisa diulang tanpa clear database atau seed ulang.

## Akun Demo

Di mock mode, password bebas. Login tetap harus memakai format email atau NIP angka.

| Login | Masuk Sebagai | Catatan |
| --- | --- | --- |
| `admin@rekasedia.sch.id` | Admin Sarpras | Untuk memantau stok dan memproses permintaan. |
| `sarah.putri@rekasedia.sch.id` | Guru | Untuk mencoba katalog, keranjang, dan status pesanan. |

## Cara Menjalankan

Pastikan sudah ada Node.js dan npm.

```bash
npm install
npm run dev
```

Buka aplikasi di:

```text
http://localhost:5173
```

Untuk memastikan build production aman:

```bash
npm run build
```

Perintah lain yang tersedia:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan frontend Vite. |
| `npm run build` | Membuat build production. |
| `npm run preview` | Preview hasil build. |
| `npm run lint` | Menjalankan ESLint. |
| `npm run server` | Menjalankan server Express. |
| `npm run dev:full` | Menjalankan frontend dan server bersamaan. |

## Tech Stack

<table>
  <thead>
    <tr>
      <th>Bagian</th>
      <th>Teknologi</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Frontend</td>
      <td>React 19, TypeScript</td>
    </tr>
    <tr>
      <td>Build Tool</td>
      <td>Vite</td>
    </tr>
    <tr>
      <td>Routing</td>
      <td>React Router</td>
    </tr>
    <tr>
      <td>Chart</td>
      <td>Chart.js, react-chartjs-2</td>
    </tr>
    <tr>
      <td>Styling</td>
      <td>CSS Modules, CSS variables</td>
    </tr>
    <tr>
      <td>Icons</td>
      <td>Font Awesome</td>
    </tr>
    <tr>
      <td>Backend Optional</td>
      <td>Express, PostgreSQL tooling</td>
    </tr>
  </tbody>
</table>

## Struktur Project

```text
src/
  components/        Komponen UI reusable
  data/              Data dummy untuk demo
  pages/
    admin/           Halaman dashboard admin
    teacher/         Halaman dashboard guru
  services/          Mock API dan API wrapper
  styles/            CSS Modules dan design tokens
  utils/             Helper kecil, termasuk gambar item otomatis
```

File penting:

| File | Fungsi |
| --- | --- |
| `src/services/api.ts` | Pusat mock API. Data dummy dibaca, diubah, dan disimpan sementara ke session. |
| `src/data/mockData.ts` | Seed data awal untuk user, item, request, loan, dan report. |
| `src/utils/itemImages.ts` | Generator gambar item berdasarkan nama barang. |
| `src/App.tsx` | Konfigurasi route utama. |
| `server/` | Arah integrasi backend untuk pengembangan berikutnya. |

## Alur Demo yang Disarankan

1. Login sebagai `sarah.putri@rekasedia.sch.id`.
2. Buka katalog inventaris.
3. Tambahkan beberapa barang ke keranjang dan ajukan permintaan.
4. Logout, lalu login sebagai `admin@rekasedia.sch.id`.
5. Buka dashboard atau menu permintaan.
6. Setujui salah satu permintaan.
7. Cek stok di inventaris admin atau katalog guru.

Dengan alur ini, hubungan antar data dummy terlihat jelas tanpa perlu backend.

## Catatan Backend

Folder `server/` dan file SQL masih ada untuk arah integrasi backend, tetapi versi demo saat ini tidak bergantung ke backend. Kalau nanti ingin kembali ke API sungguhan, mock mode di `src/services/api.ts` bisa dimatikan dan endpoint backend bisa dipakai lagi.

## Status Pengembangan

Yang sudah ada:

- Login dan register UI.
- Dashboard admin dan guru.
- Katalog inventaris dengan gambar item otomatis.
- Keranjang permintaan guru.
- Validasi permintaan oleh admin.
- Data dummy yang terhubung antar halaman.
- Penyimpanan dummy sementara per sesi browser.

Yang bisa dikembangkan berikutnya:

- Integrasi database penuh.
- Upload gambar barang asli.
- Export laporan.
- Notifikasi untuk perubahan status permintaan.
- Hak akses dan validasi backend yang lebih lengkap.

## Lisensi

Project ini dibuat untuk kebutuhan akademis dan demo pengembangan aplikasi inventaris sekolah.
