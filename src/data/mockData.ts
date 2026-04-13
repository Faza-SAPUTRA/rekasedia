// ============================================
// RekaSedia — Static Data Layer
// Mirrors MySQL schema for frontend usage
// ============================================

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'guru';
  department: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  category_name: string;
  stock: number;
  unit: string;
  description: string;
  image_url: string | null;
  is_loanable: boolean;
}

export interface Request {
  id: number;
  req_code: string;
  item_id: number;
  item_name: string;
  requester_name: string;
  requester_role: string;
  quantity: number;
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  priority: 'REGULER' | 'URGENT';
}

export interface Loan {
  id: number;
  item_id: number;
  item_name: string;
  item_image: string | null;
  borrower_name: string;
  borrow_date: string;
  due_date: string;
  status: 'DIPINJAM' | 'DIKEMBALIKAN';
}

export interface MonthlyReport {
  id: number;
  semester: string;
  month_name: string;
  month_order: number;
  total_items_ordered: number;
  total_assets_borrowed: number;
}

// --- SEED DATA ---

export const users: User[] = [
  { id: 1, full_name: 'Admin Staff', email: 'admin@rekasedia.sch.id', role: 'admin', department: 'Administrasi' },
  { id: 2, full_name: 'Budi Utomo', email: 'budi.utomo@rekasedia.sch.id', role: 'guru', department: 'Matematika' },
  { id: 3, full_name: 'Siti Aminah', email: 'siti.aminah@rekasedia.sch.id', role: 'guru', department: 'Tata Usaha' },
  { id: 4, full_name: 'Ahmad Faisal', email: 'ahmad.faisal@rekasedia.sch.id', role: 'guru', department: 'Fisika' },
  { id: 5, full_name: 'Dewi Lestari', email: 'dewi.lestari@rekasedia.sch.id', role: 'guru', department: 'Kesiswaan' },
  { id: 6, full_name: 'Ibu Sarah Putri', email: 'sarah.putri@rekasedia.sch.id', role: 'guru', department: 'Wali Kelas 10-A' },
];

export const categories: Category[] = [
  { id: 1, name: 'ATK', description: 'Alat Tulis Kantor' },
  { id: 2, name: 'Kertas', description: 'Produk kertas dan cetakan' },
  { id: 3, name: 'Elektronik', description: 'Peralatan elektronik dan digital' },
  { id: 4, name: 'Kebersihan', description: 'Alat kebersihan dan kesehatan' },
];

export const items: Item[] = [
  { id: 1, sku: 'SKU-2023-001', name: 'Spidol Marker Set', category_id: 1, category_name: 'ATK', stock: 15, unit: 'Set', description: 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', image_url: null, is_loanable: false },
  { id: 2, sku: 'SKU-2023-002', name: 'Kertas A4 80gr', category_id: 2, category_name: 'Kertas', stock: 2, unit: 'Rim', description: 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', image_url: null, is_loanable: false },
  { id: 3, sku: 'SKU-2023-003', name: 'Stapler Besar HD', category_id: 1, category_name: 'ATK', stock: 8, unit: 'Unit', description: 'Stapler heavy-duty untuk dokumen tebal.', image_url: null, is_loanable: false },
  { id: 4, sku: 'SKU-2023-004', name: 'Buku Catatan Eksklusif', category_id: 1, category_name: 'ATK', stock: 20, unit: 'Unit', description: 'Buku catatan hardcover premium untuk pencatatan.', image_url: null, is_loanable: false },
  { id: 5, sku: 'SKU-2023-005', name: 'Kabel HDMI 4K 2m', category_id: 3, category_name: 'Elektronik', stock: 12, unit: 'Unit', description: 'Kabel HDMI 4K untuk koneksi proyektor.', image_url: null, is_loanable: false },
  { id: 6, sku: 'SKU-2023-006', name: 'Tinta Printer Black', category_id: 1, category_name: 'ATK', stock: 4, unit: 'Botol', description: 'Tinta printer HP Black untuk printer kantor.', image_url: null, is_loanable: false },
  { id: 7, sku: 'SKU-2023-007', name: 'Whiteboard Marker', category_id: 1, category_name: 'ATK', stock: 45, unit: 'Unit', description: 'Spidol hitam anti-kering, tinta tebal untuk papan tulis kelas.', image_url: null, is_loanable: false },
  { id: 8, sku: 'SKU-2023-008', name: 'Kertas A4 HVS', category_id: 2, category_name: 'Kertas', stock: 12, unit: 'Rim', description: 'Kertas 80gsm untuk penggandaan soal ujian & materi ajar.', image_url: null, is_loanable: false },
  { id: 9, sku: 'SKU-2023-009', name: 'Proyektor Digital', category_id: 3, category_name: 'Elektronik', stock: 4, unit: 'Unit', description: 'Unit proyektor portabel lengkap dengan kabel HDMI/VGA.', image_url: null, is_loanable: true },
  { id: 10, sku: 'SKU-2023-010', name: 'Masker Medis', category_id: 4, category_name: 'Kebersihan', stock: 20, unit: 'Box', description: 'Masker 3-ply standar kesehatan untuk kebutuhan UKS/Kelas.', image_url: null, is_loanable: false },
  { id: 11, sku: 'SKU-2023-011', name: 'Tinta Toner Laserjet', category_id: 1, category_name: 'ATK', stock: 1, unit: 'Unit', description: 'Toner untuk printer laserjet kantor.', image_url: null, is_loanable: false },
  { id: 12, sku: 'SKU-2023-012', name: 'Materai 10.000', category_id: 1, category_name: 'ATK', stock: 3, unit: 'Lembar', description: 'Materai tempel Rp10.000 untuk dokumen resmi.', image_url: null, is_loanable: false },
  { id: 13, sku: 'SKU-2023-013', name: 'Digital Projector Epson X-400', category_id: 3, category_name: 'Elektronik', stock: 3, unit: 'Unit', description: 'Proyektor Epson X-400 untuk ruang rapat dan kelas.', image_url: null, is_loanable: true },
  { id: 14, sku: 'SKU-2023-014', name: 'Portable Speaker JBL Boombox', category_id: 3, category_name: 'Elektronik', stock: 2, unit: 'Unit', description: 'Speaker portabel JBL untuk kegiatan sekolah.', image_url: null, is_loanable: true },
  { id: 15, sku: 'SKU-2023-015', name: 'MacBook Air M2 Silver', category_id: 3, category_name: 'Elektronik', stock: 1, unit: 'Unit', description: 'Laptop MacBook Air M2 untuk keperluan presentasi.', image_url: null, is_loanable: true },
  { id: 16, sku: 'SKU-2023-016', name: 'Sticky Notes Neon', category_id: 1, category_name: 'ATK', stock: 30, unit: 'Pack', description: 'Sticky notes warna neon untuk penanda dokumen.', image_url: null, is_loanable: false },
  { id: 17, sku: 'SKU-2023-017', name: 'Spidol Whiteboard (Biru)', category_id: 1, category_name: 'ATK', stock: 25, unit: 'Unit', description: 'Spidol whiteboard warna biru.', image_url: null, is_loanable: false },
  { id: 18, sku: 'SKU-2023-018', name: 'Buku Induk Siswa 2023', category_id: 1, category_name: 'ATK', stock: 10, unit: 'Unit', description: 'Buku induk untuk pencatatan data siswa tahun 2023.', image_url: null, is_loanable: false },
];

export const requests: Request[] = [
  { id: 1, req_code: 'REQ-001', item_id: 2, item_name: 'Kertas A4 80gr', requester_name: 'Budi Utomo', requester_role: 'Guru Matematika', quantity: 5, request_date: '24 Okt 2023', status: 'PENDING', priority: 'REGULER' },
  { id: 2, req_code: 'REQ-002', item_id: 6, item_name: 'Tinta Printer HP Black', requester_name: 'Siti Aminah', requester_role: 'Tata Usaha', quantity: 2, request_date: '24 Okt 2023', status: 'PENDING', priority: 'URGENT' },
  { id: 3, req_code: 'REQ-003', item_id: 17, item_name: 'Spidol Whiteboard (Biru)', requester_name: 'Ahmad Faisal', requester_role: 'Guru Fisika', quantity: 10, request_date: '23 Okt 2023', status: 'PENDING', priority: 'REGULER' },
  { id: 4, req_code: 'REQ-004', item_id: 18, item_name: 'Buku Induk Siswa 2023', requester_name: 'Dewi Lestari', requester_role: 'Kesiswaan', quantity: 3, request_date: '23 Okt 2023', status: 'PENDING', priority: 'REGULER' },
];

export const loans: Loan[] = [
  { id: 1, item_id: 13, item_name: 'Digital Projector Epson X-400', item_image: null, borrower_name: 'Ibu Sarah Putri', borrow_date: '20 Okt 2023', due_date: '25 Okt 2023', status: 'DIPINJAM' },
  { id: 2, item_id: 14, item_name: 'Portable Speaker JBL Boombox', item_image: null, borrower_name: 'Ibu Sarah Putri', borrow_date: '20 Okt 2023', due_date: '28 Okt 2023', status: 'DIPINJAM' },
  { id: 3, item_id: 15, item_name: 'MacBook Air M2 Silver', item_image: null, borrower_name: 'Ibu Sarah Putri', borrow_date: '15 Okt 2023', due_date: '30 Okt 2023', status: 'DIPINJAM' },
];

export const monthlyReports: MonthlyReport[] = [
  { id: 1, semester: 'Semester Ganjil 2025/2026', month_name: 'Januari', month_order: 1, total_items_ordered: 124, total_assets_borrowed: 12 },
  { id: 2, semester: 'Semester Ganjil 2025/2026', month_name: 'Februari', month_order: 2, total_items_ordered: 89, total_assets_borrowed: 8 },
  { id: 3, semester: 'Semester Ganjil 2025/2026', month_name: 'Maret', month_order: 3, total_items_ordered: 156, total_assets_borrowed: 15 },
  { id: 4, semester: 'Semester Ganjil 2025/2026', month_name: 'April', month_order: 4, total_items_ordered: 42, total_assets_borrowed: 5 },
  { id: 5, semester: 'Semester Ganjil 2025/2026', month_name: 'Mei', month_order: 5, total_items_ordered: 110, total_assets_borrowed: 10 },
  { id: 6, semester: 'Semester Ganjil 2025/2026', month_name: 'Juni', month_order: 6, total_items_ordered: 95, total_assets_borrowed: 9 },
];

// Helper: get items with LOW stock for the stat card (≤ 5, consumable only)
export function getLowStockItems(): Item[] {
  return items.filter(item => item.stock <= 5 && !item.is_loanable);
}

// Helper: get items with CRITICAL stock for the bottom section (≤ 3)
export function getCriticalStockItems(): Item[] {
  return items.filter(item => item.stock <= 3 && !item.is_loanable);
}

// Helper: total items count
export function getTotalItemsCount(): number {
  return items.reduce((sum, item) => sum + item.stock, 0);
}
