require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir le site statique (frontend/)
app.use(express.static(path.join(__dirname, '../frontend')));

// Interface admin
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));

// Toute autre route → index.html (SPA fallback)
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

if (require.main === module) {
  // Lancement direct : node server.js
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
      console.log(`Interface admin sur http://localhost:${PORT}/admin`);
    });
  });
} else {
  // Vercel serverless : initialise la DB au démarrage du module
  initDatabase().catch(console.error);
}

module.exports = app;
