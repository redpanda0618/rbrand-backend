const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cat: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  outOfStock: { type: Boolean, default: false },
  img: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  colors: { type: [{ n: String, hex: String }], default: [] },
  disabledSizes: { type: [String], default: [] },
  disabledColors: { type: [String], default: [] },
  tag: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  arrival: { type: Boolean, default: false },
  desc: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
