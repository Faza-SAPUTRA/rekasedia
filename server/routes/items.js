import { Router } from 'express';
import pool from '../db.js';

const router = Router();

async function resolveCategoryId(categoryId, categoryName) {
  if (categoryId) return Number(categoryId);
  if (!categoryName) return null;

  const { rows } = await pool.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
  return rows[0]?.id || null;
}

async function fetchItemById(id) {
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

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name);
    if (!resolvedCategoryId) {
      return res.status(400).json({ error: 'Kategori tidak valid.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO items (name, category_id, stock, unit, description, image_url, is_loanable)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        name.trim(),
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
      category_id,
      category_name,
      stock = existing.stock,
      unit = existing.unit,
      description = existing.description,
      image_url = existing.image_url,
      is_loanable = existing.is_loanable,
    } = req.body;

    const resolvedCategoryId = await resolveCategoryId(category_id, category_name) || existing.category_id;

    await pool.query(
      `UPDATE items
       SET name = $1,
           category_id = $2,
           stock = $3,
           unit = $4,
           description = $5,
           image_url = $6,
           is_loanable = $7,
           updated_at = NOW()
       WHERE id = $8`,
      [
        name.trim(),
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
