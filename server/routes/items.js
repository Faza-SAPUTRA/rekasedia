import { Router } from 'express';
import pool from '../db.js';

const router = Router();

let imageColumnReady;
let skuColumnReady;

function createSkuForItem(id) {
  return `SKU-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
}

async function ensureSkuColumnSupportsExistingData() {
  if (!skuColumnReady) {
    skuColumnReady = (async () => {
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS sku VARCHAR(50)');
      await pool.query(
        `UPDATE items
         SET sku = 'SKU-' || EXTRACT(YEAR FROM CURRENT_DATE)::INT || '-' || LPAD(id::text, 3, '0')
         WHERE sku IS NULL OR TRIM(sku) = ''`
      );
    })().catch((error) => {
      skuColumnReady = undefined;
      throw error;
    });
  }

  return skuColumnReady;
}

async function ensureImageColumnSupportsUploads() {
  if (!imageColumnReady) {
    imageColumnReady = (async () => {
      const { rows } = await pool.query(
        `SELECT data_type, character_maximum_length
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'items'
           AND column_name = 'image_url'`
      );
      const imageColumn = rows[0];

      if (imageColumn?.data_type !== 'text') {
        await pool.query('ALTER TABLE items ALTER COLUMN image_url TYPE TEXT');
      }
    })().catch((error) => {
      imageColumnReady = undefined;
      throw error;
    });
  }

  return imageColumnReady;
}

async function resolveCategoryId(categoryId, categoryName) {
  if (categoryId) return Number(categoryId);
  if (!categoryName) return null;

  const { rows } = await pool.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
  return rows[0]?.id || null;
}

async function fetchItemById(id) {
  await ensureSkuColumnSupportsExistingData();
  const { rows } = await pool.query(
    `
      SELECT i.*, c.name AS category_name
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.id = $1
    `,
    [id]
  );
  return rows[0] || null;
}

router.get('/', async (req, res) => {
  try {
    await ensureSkuColumnSupportsExistingData();
    const { rows } = await pool.query(`
      SELECT i.*, c.name AS category_name
      FROM items i
      JOIN categories c ON i.category_id = c.id
      ORDER BY i.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Gagal mengambil data barang.' });
  }
});

router.get('/categories/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await fetchItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }
    res.json(item);
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Gagal mengambil detail barang.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      sku,
      category_id,
      category_name,
      stock = 0,
      unit = 'Unit',
      description = '',
      image_url = null,
      is_loanable = false,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nama barang wajib diisi.' });
    }

    await ensureSkuColumnSupportsExistingData();

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name);
    if (!resolvedCategoryId) {
      return res.status(400).json({ error: 'Kategori tidak valid.' });
    }

    if (image_url) {
      await ensureImageColumnSupportsUploads();
    }

    const { rows } = await pool.query(
      `INSERT INTO items (name, sku, category_id, stock, unit, description, image_url, is_loanable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        name.trim(),
        String(sku || '').trim() || createSkuForItem(Date.now()),
        resolvedCategoryId,
        Math.max(0, Number(stock) || 0),
        unit || 'Unit',
        description || null,
        image_url || null,
        Boolean(is_loanable),
      ]
    );

    const item = await fetchItemById(rows[0].id);
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Gagal menambah barang.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await fetchItemById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }

    const {
      name = existing.name,
      sku = existing.sku,
      category_id,
      category_name,
      stock = existing.stock,
      unit = existing.unit,
      description = existing.description,
      image_url = existing.image_url,
      is_loanable = existing.is_loanable,
    } = req.body;

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name) || existing.category_id;

    if (image_url) {
      await ensureImageColumnSupportsUploads();
    }

    await pool.query(
      `UPDATE items
       SET name = $1,
           sku = $2,
           category_id = $3,
           stock = $4,
           unit = $5,
           description = $6,
           image_url = $7,
           is_loanable = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [
        name.trim(),
        String(sku || '').trim() || createSkuForItem(req.params.id),
        resolvedCategoryId,
        Math.max(0, Number(stock) || 0),
        unit || 'Unit',
        description || null,
        image_url || null,
        Boolean(is_loanable),
        req.params.id,
      ]
    );

    const item = await fetchItemById(req.params.id);
    res.json(item);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Gagal memperbarui barang.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Barang tidak ditemukan.' });
    }
    res.json({ message: 'Barang berhasil dihapus.' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Gagal menghapus barang.' });
  }
});

export default router;
