const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const { requireAuth } = require('../middleware/auth');

function signToken(id, type) {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/signup  { name, email, phone, password }
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password || password.length < 6) {
      return res.status(400).json({ error: 'Please fill all fields (password: at least 6 characters)' });
    }
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (exists) return res.status(409).json({ error: 'Email or phone already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), phone, passwordHash });
    const token = signToken(user._id, 'user');
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, since: user.since }
    });
  } catch (e) {
    res.status(500).json({ error: 'Signup failed', detail: e.message });
  }
});

// POST /api/auth/login  { emailOrPhone, password }
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: (emailOrPhone || '').toLowerCase() }, { phone: emailOrPhone }]
    });
    if (!user) return res.status(401).json({ error: 'Account not found' });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });

    const token = signToken(user._id, 'user');
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, since: user.since }
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed', detail: e.message });
  }
});

// GET /api/auth/me  (needs Authorization header)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// ---- Admin login (separate from customer login) ----
// POST /api/auth/admin-login  { email, password }
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: (email || '').toLowerCase() });
    if (!admin) return res.status(401).json({ error: 'Admin not found' });
    const ok = await bcrypt.compare(password || '', admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    const token = signToken(admin._id, 'admin');
    res.json({ token, admin: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed', detail: e.message });
  }
});

module.exports = router;
