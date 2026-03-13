const router = require('express').Router();
const Experience = require('../models/experience');
const auth = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const experiences = await Experience.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json(experiences);
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { title, company, startDate, endDate, bullets, order } = req.body;
    if (!title || !company) return res.status(400).json({ error: 'Title and company are required' });
    const experience = await Experience.create({
      title, company,
      startDate: startDate || '',
      endDate: endDate || '',
      bullets: bullets || [],
      order: order || 0,
    });
    res.status(201).json(experience);
  } catch (err) { next(err); }
});

router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { title, company, startDate, endDate, bullets, order } = req.body;
    const experience = await Experience.findByIdAndUpdate(
      req.params.id,
      { $set: { title, company, startDate, endDate, bullets, order } },
      { new: true }
    );
    if (!experience) return res.status(404).json({ error: 'Not found' });
    res.json(experience);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const experience = await Experience.findByIdAndDelete(req.params.id);
    if (!experience) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;