import { pathToFileURL } from 'url';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const passwordHash = await bcrypt.hash('admin123', 10);

const users = [
  [1, 'Admin Staff', 'admin@rekasedia.sch.id', passwordHash, 'admin', 'Administrasi'],
  [2, 'Budi Utomo', 'budi.utomo@rekasedia.sch.id', passwordHash, 'guru', 'Matematika'],
  [3, 'Siti Aminah', 'siti.aminah@rekasedia.sch.id', passwordHash, 'guru', 'Tata Usaha'],
  [4, 'Ahmad Faisal', 'ahmad.faisal@rekasedia.sch.id', passwordHash, 'guru', 'Fisika'],
  [5, 'Dewi Lestari', 'dewi.lestari@rekasedia.sch.id', passwordHash, 'guru', 'Kesiswaan'],
  [6, 'Ibu Sarah Putri', 'sarah.putri@rekasedia.sch.id', passwordHash, 'guru', 'Wali Kelas 10-A'],
];

const categories = [
  [1, 'ATK', 'Alat Tulis Kantor'],
  [2, 'Kertas', 'Produk kertas dan cetakan'],
  [3, 'Elektronik', 'Peralatan elektronik dan digital'],
  [4, 'Kebersihan', 'Alat kebersihan dan kesehatan'],
  [5, 'Furnitur', 'Meja, kursi, papan tulis, dan perlengkapan kelas jangka panjang'],
];

const items = [
  [1, 'Spidol Marker Set', 1, 15, 'Set', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', '/assets/items/spidol_hitam.png', false],
  [2, 'Kertas A4 80gr', 2, 2, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', '/assets/items/kertas_hvs_a4.png', false],
  [3, 'Stapler Besar HD', 1, 8, 'Unit', 'Stapler heavy-duty untuk dokumen tebal.', null, false],
  [4, 'Buku Catatan Eksklusif', 1, 20, 'Unit', 'Buku catatan hardcover premium untuk pencatatan.', null, false],
  [5, 'Kabel HDMI 4K 2m', 3, 12, 'Unit', 'Kabel HDMI 4K untuk koneksi proyektor.', '/assets/items/kabel_hdmi.png', false],
  [6, 'Tinta Printer Black', 1, 4, 'Botol', 'Tinta printer HP Black untuk printer kantor.', '/assets/items/tinta_printer.png', false],
  [7, 'Whiteboard Marker', 1, 45, 'Unit', 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', '/assets/items/spidol_hitam.png', false],
  [8, 'Kertas A4 HVS', 2, 12, 'Rim', 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', '/assets/items/kertas_hvs_a4.png', false],
  [9, 'Proyektor Digital', 3, 4, 'Unit', 'Unit proyektor portabel lengkap dengan kabel HDMI/VGA.', '/assets/items/proyektor_epson.png', true],
  [10, 'Masker Medis', 4, 20, 'Box', 'Masker 3-ply standar kesehatan untuk kebutuhan UKS/Kelas.', null, false],
  [11, 'Tinta Toner Laserjet', 1, 1, 'Unit', 'Toner untuk printer laserjet kantor.', '/assets/items/tinta_printer.png', false],
  [12, 'Materai 10.000', 1, 3, 'Lembar', 'Materai tempel Rp10.000 untuk dokumen resmi.', null, false],
  [13, 'Digital Projector Epson X-400', 3, 3, 'Unit', 'Proyektor Epson X-400 untuk ruang rapat dan kelas.', '/assets/items/proyektor_epson.png', true],
  [14, 'Portable Speaker JBL Boombox', 3, 2, 'Unit', 'Speaker portabel JBL untuk kegiatan sekolah.', '/assets/items/speaker_jbl.png', true],
  [15, 'MacBook Air M2 Silver', 3, 1, 'Unit', 'Laptop MacBook Air M2 untuk keperluan presentasi.', null, true],
  [16, 'Sticky Notes Neon', 1, 30, 'Pack', 'Sticky notes warna neon untuk penanda dokumen.', null, false],
  [17, 'Spidol Whiteboard (Biru)', 1, 25, 'Unit', 'Spidol whiteboard warna biru.', '/assets/items/spidol_hitam.png', false],
  [18, 'Buku Induk Siswa 2023', 1, 10, 'Unit', 'Buku induk untuk pencatatan data siswa tahun 2023.', null, false],
  [19, 'Meja Kelas Kayu', 5, 24, 'Unit', 'Meja kelas untuk penggunaan jangka panjang.', null, true],
  [20, 'Kursi Siswa', 5, 36, 'Unit', 'Kursi siswa untuk ruang kelas.', null, true],
  [21, 'Papan Tulis Whiteboard', 5, 6, 'Unit', 'Papan tulis kelas untuk aset sekolah.', null, true],
];

const requests = [
  [1, 'REQ-2023-001', 2, 2, 5, '2023-10-24', 'PENDING', 'REGULER'],
  [2, 'REQ-2023-002', 6, 3, 2, '2023-10-24', 'PENDING', 'URGENT'],
  [3, 'REQ-2023-003', 17, 4, 10, '2023-10-23', 'PENDING', 'REGULER'],
  [4, 'REQ-2023-004', 18, 5, 3, '2023-10-23', 'PENDING', 'REGULER'],
];

const loans = [
  [1, 13, 6, '2023-10-20', '2023-10-25', null, 'DIPINJAM'],
  [2, 14, 6, '2023-10-20', '2023-10-28', null, 'DIPINJAM'],
  [3, 15, 6, '2023-10-15', '2023-10-30', null, 'DIPINJAM'],
  [4, 9, 6, '2023-10-10', '2023-10-15', '2023-10-15', 'DIKEMBALIKAN'],
  [5, 13, 1, '2023-10-18', '2023-10-22', null, 'DIPINJAM'],
];

const monthlyReports = [
  [1, 'Semester Ganjil 2025/2026', 'Januari', 1, 124, 12],
  [2, 'Semester Ganjil 2025/2026', 'Februari', 2, 89, 8],
  [3, 'Semester Ganjil 2025/2026', 'Maret', 3, 156, 15],
  [4, 'Semester Ganjil 2025/2026', 'April', 4, 42, 5],
  [5, 'Semester Ganjil 2025/2026', 'Mei', 5, 110, 10],
  [6, 'Semester Ganjil 2025/2026', 'Juni', 6, 95, 9],
];

async function insertMany(client, table, columns, rows) {
  const values = rows
    .map((row, rowIndex) => `(${row.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`)
    .join(', ');
  await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values}`,
    rows.flat()
  );
}

export async function seedSupabaseMock() {
  const client = await pool.connect();
  await client.query('BEGIN');

  try {
    await client.query('TRUNCATE monthly_reports, loans, requests, items, categories, users RESTART IDENTITY CASCADE');

    await insertMany(client, 'users', ['id', 'full_name', 'email', 'password_hash', 'role', 'department'], users);
    await insertMany(client, 'categories', ['id', 'name', 'description'], categories);
    await insertMany(client, 'items', ['id', 'name', 'category_id', 'stock', 'unit', 'description', 'image_url', 'is_loanable'], items);
    await insertMany(client, 'requests', ['id', 'req_code', 'item_id', 'requester_id', 'quantity', 'request_date', 'status', 'priority'], requests);
    await insertMany(client, 'loans', ['id', 'item_id', 'borrower_id', 'borrow_date', 'due_date', 'return_date', 'status'], loans);
    await insertMany(client, 'monthly_reports', ['id', 'semester', 'month_name', 'month_order', 'total_items_ordered', 'total_assets_borrowed'], monthlyReports);

    for (const table of ['users', 'categories', 'items', 'requests', 'loans', 'monthly_reports']) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table}`);
    }

    await client.query('COMMIT');

    const counts = {};
    for (const table of ['users', 'categories', 'items', 'requests', 'loans', 'monthly_reports']) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS total FROM ${table}`);
      counts[table] = rows[0].total;
    }

    return counts;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const counts = await seedSupabaseMock();
    for (const [table, total] of Object.entries(counts)) {
      console.log(`${table}: ${total}`);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
