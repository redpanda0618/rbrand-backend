const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');

// GET /api/products  -> everyone can see the store's products
router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// GET /api/products/:id -> single product detail page
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

// POST /api/products  (admin only) -> add a new product
router.post('/', requireAdmin, async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: 'Could not create product', detail: e.message });
  }
});

// PUT /api/products/:id  (admin only) -> edit price/stock/photos/out-of-stock/etc
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: 'Could not update product', detail: e.message });
  }
});

// DELETE /api/products/:id  (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

module.exports = router;
