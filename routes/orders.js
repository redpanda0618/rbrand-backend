const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function makeOrderNumber() {
  return 'RBF' + Date.now().toString(36).toUpperCase();
}

// POST /api/orders  { items: [{productId, size, color, qty}], address, paymentMethod }
// IMPORTANT: price and stock are re-checked here from the database.
// The app never trusts a price sent by the browser -- that's how people
// try to buy a ₹9,999 shoe for ₹1 by editing the page's JavaScript.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, address, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!address || !address.name || !address.phone || !address.line || !address.pin) {
      return res.status(400).json({ error: 'Delivery address is incomplete' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${it.productId}` });
      if (product.outOfStock || product.stock < it.qty) {
        return res.status(400).json({ error: `${product.name} is out of stock` });
      }
      orderItems.push({
        product: product._id, name: product.name, img: product.img,
        size: it.size, color: it.color, qty: it.qty, price: product.price // <-- DB price, not client price
      });
      subtotal += product.price * it.qty;
    }

    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;

    const order = await Order.create({
      orderNumber: makeOrderNumber(),
      user: req.user.id,
      items: orderItems,
      address,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      subtotal, shipping, tax, total
    });

    // reduce stock only after the order is successfully created
    for (const it of items) {
      await Product.findByIdAndUpdate(it.productId, { $inc: { stock: -it.qty } });
    }

    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: 'Could not place order', detail: e.message });
  }
});

// GET /api/orders/my -> only the logged-in customer's own orders
router.get('/my', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders  (admin only) -> every order, for the admin panel
router.get('/', requireAdmin, async (req, res) => {
  const orders = await Order.find().populate('user', 'name phone email').sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/:id/status  (admin only)  { status }
router.put('/:id/status', requireAdmin, async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
