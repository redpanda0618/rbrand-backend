require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const app = express();

// --- Basic setup ---
app.use(express.json({ limit: '10mb' })); // 10mb so product photo uploads don't get rejected
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));

app.get('/', (req, res) => res.json({ status: 'Rbrand Factory API is running' }));

// --- Connect to database, create the first admin account, then start listening ---
async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env -- see .env.example');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (adminEmail && process.env.ADMIN_PASSWORD) {
    const existing = await Admin.findOne({ email: adminEmail });
    if (!existing) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await Admin.create({ email: adminEmail, passwordHash, role: 'owner' });
      console.log(`Created first admin account: ${adminEmail}`);
    }
  }

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
