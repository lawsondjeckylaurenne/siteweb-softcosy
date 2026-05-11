const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Hash du mot de passe admin stocké en mémoire au démarrage
let adminPasswordHash = null;

async function getPasswordHash() {
  if (!adminPasswordHash) {
    adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  }
  return adminPasswordHash;
}

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Mot de passe requis' });

    const hash = await getPasswordHash();
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
