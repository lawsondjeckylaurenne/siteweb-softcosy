const router = require('express').Router();
const { pool } = require('../database');
const requireAuth = require('../middleware/auth');

// GET /api/products — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// GET /api/products/:id — public
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// POST /api/products — admin
router.post('/', requireAuth, async (req, res) => {
  try {
    const { brand, category, name, price, sizes, colors, fabric, description, images } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    // Génération automatique du SKU
    const { rows: skuRows } = await pool.query(`
      SELECT COALESCE(
        MAX(CAST(SUBSTRING(sku, 3, LENGTH(sku)-3) AS INTEGER)), 0
      ) + 1 AS next_num
      FROM products
      WHERE sku ~ '^SC[0-9]+#$'
    `);
    const sku = `SC${String(skuRows[0].next_num).padStart(4, '0')}#`;

    const { rows } = await pool.query(
      `INSERT INTO products (sku, brand, category, name, price, sizes, colors, fabric, description, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        sku,
        brand || null,
        JSON.stringify(category || []),
        name,
        price || 0,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        fabric || null,
        description || null,
        JSON.stringify(images || []),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// PUT /api/products/:id — admin
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { sku, brand, category, name, price, sizes, colors, fabric, description, images } = req.body;

    const { rows } = await pool.query(
      `UPDATE products SET
        sku=$1, brand=$2, category=$3, name=$4, price=$5,
        sizes=$6, colors=$7, fabric=$8, description=$9, images=$10
       WHERE id=$11 RETURNING *`,
      [
        sku || null,
        brand || null,
        JSON.stringify(category || []),
        name,
        price || 0,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        fabric || null,
        description || null,
        JSON.stringify(images || []),
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

// DELETE /api/products/:id — admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
