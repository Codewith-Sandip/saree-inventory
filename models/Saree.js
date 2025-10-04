const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SareeSchema = new Schema({
  brand: { type: String, required: true, trim: true },
  costPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  gstPercent: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Saree', SareeSchema);
