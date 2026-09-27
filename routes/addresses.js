const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { requireAuth } = require('../middleware/auth');

// GET /api/addresses  -> only the logged-in user's own addresses
router.get('/', requireAuth, async (req, res) => {
  const list = await Address.find({ owner: req.user.id }).sort({ isDefault: -1 });
  res.json(list);
});

// POST /api/addresses
router.post('/', requireAuth, async (req, res) => {
  const count = await Address.countDocuments({ owner: req.user.id });
  const a = await Address.create({ ...req.body, owner: req.user.id, isDefault: count === 0 });
  res.status(201).json(a);
});

// PUT /api/addresses/:id
router.put('/:id', requireAuth, async (req, res) => {
  const a = await Address.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id }, req.body, { new: true }
  );
  if (!a) return res.status(404).json({ error: 'Address not found' });
  res.json(a);
});

// PUT /api/addresses/:id/default -> set as default, unset all others
router.put('/:id/default', requireAuth, async (req, res) => {
  await Address.updateMany({ owner: req.user.id }, { isDefault: false });
  const a = await Address.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id }, { isDefault: true }, { new: true }
  );
  if (!a) return res.status(404).json({ error: 'Address not found' });
  res.json(a);
});

// DELETE /api/addresses/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const a = await Address.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!a) return res.status(404).json({ error: 'Address not found' });
  res.json({ success: true });
});

module.exports = router;
