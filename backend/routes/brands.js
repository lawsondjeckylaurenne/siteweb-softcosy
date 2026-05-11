const router = require('express').Router();
const { pool } = require('../database');
const requireAuth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Nom et slug requis' });
    const { rows } = await pool.query(
      'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cette marque existe déjà' });
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Nom et slug requis' });
    const { rows } = await pool.query(
      'UPDATE brands SET name=$1, slug=$2 WHERE id=$3 RETURNING *',
      [name, slug, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Marque non trouvée' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Cette marque existe déjà' });
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Marque non trouvée' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

module.exports = router;
