-- Ambang batas stok minimum per barang (pengganti hardcode stock <= 5).

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS min_stock INT NOT NULL DEFAULT 5;
