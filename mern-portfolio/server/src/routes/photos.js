const router = require('express').Router();
const cloudinary = require('../config/cloudinary');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all photos
router.get('/', async (req, res, next) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).lean();
    res.json(photos);
  } catch (err) {
    next(err);
  }
});

// Upload photo
router.post('/', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image required' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'portfolio' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const photo = await Photo.create({
      url: result.secure_url,
      publicId: result.public_id,
      title: req.body.title || '',
      description: req.body.description || '',
      section: req.body.section || 'section1', // ✅ ADDED
    });

    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
});

// Update photo
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { title, description, section } = req.body || {};
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, section } }, // ✅ ADDED section
      { new: true }
    );

    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    res.json(photo);
  } catch (err) {
    next(err);
  }
});

// Delete photo
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId);
    }

    await Photo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;