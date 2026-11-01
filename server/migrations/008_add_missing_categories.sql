-- Melengkapi kategori sesuai dokumen: Tinta & Toner, Peralatan Kelas.
-- Furnitur sudah ada; Kebersihan tetap dipertahankan.

INSERT INTO categories (name, description) VALUES
  ('Tinta & Toner', 'Tinta printer, toner, dan refill cartridge'),
  ('Peralatan Kelas', 'Peralatan penunjang kegiatan belajar di kelas')
ON CONFLICT (name) DO NOTHING;
