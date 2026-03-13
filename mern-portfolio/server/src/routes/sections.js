const router = require('express').Router();
const Section = require('../models/Section');
const auth = require('../middleware/auth');

// Get section
router.get('/:key', async (req, res, next) => {
  try {
    const key = req.params.key;
    const section = await Section.findOne({ key }).lean();

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json(section);
  } catch (err) {
    next(err);
  }
});

// Update section
router.put('/:key', auth, async (req, res, next) => {
  try {
    const key = req.params.key;
    const { title = '', content = '' } = req.body || {};

    const section = await Section.findOneAndUpdate(
      { key },
      { $set: { title, content } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(section);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
