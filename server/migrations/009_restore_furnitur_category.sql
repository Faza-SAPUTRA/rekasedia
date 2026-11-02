-- Kembalikan kategori Furnitur yang hilang dari data production.
-- Kategori sesuai dokumen: ATK, Kertas, Tinta & Toner, Peralatan Kelas, Elektronik, Furnitur.

INSERT INTO categories (name, description) VALUES
  ('Furnitur', 'Meja, kursi, papan tulis, dan perlengkapan kelas jangka panjang')
ON CONFLICT (name) DO NOTHING;
