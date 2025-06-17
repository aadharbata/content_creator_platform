const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  gstNumber: { type: String }, // Optional for 'I do not have GST'
  companyName: { type: String },
  brandName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  industry: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema); 