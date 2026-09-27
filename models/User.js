const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  preferredPayment: { type: String, default: 'cod' },
  since: { type: String, default: () => new Date().getFullYear().toString() }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
