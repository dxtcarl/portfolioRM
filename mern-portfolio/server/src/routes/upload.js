// backend/routes/upload.js
// Generic image upload route — uploads to Cloudinary, returns URL only
// Does NOT touch the Photo collection in MongoDB
const router = require('express').Router();
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image required' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'portfolio/misc' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Return only the URL — no Photo document saved
    res.json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;