const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const requireAuth = require('../middleware/auth');

// Multer stocke en mémoire (on envoie directement vers Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées'));
    }
    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'softcosy',
        resource_type: 'image',
        // Redimensionnement : max 1200px de large, jamais agrandi
        width: 1200,
        crop: 'limit',
        // Compression automatique (Cloudinary choisit le meilleur taux)
        quality: 'auto:good',
        // Converti en WebP si le navigateur le supporte (format plus léger)
        fetch_format: 'auto',
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// POST /api/upload — envoie une ou plusieurs photos vers Cloudinary
router.post('/', requireAuth, upload.array('photos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune photo reçue' });
    }
    const results = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );
    const urls = results.map((r) => ({ url: r.secure_url, public_id: r.public_id }));
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur upload' });
  }
});

// DELETE /api/upload — supprime une photo de Cloudinary
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: 'public_id requis' });
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur suppression photo' });
  }
});

module.exports = router;
