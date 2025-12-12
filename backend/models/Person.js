const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  city: { type: String },
  email: { type: String },
  master: { type: String },
  weight: { type: String },
  districtName: { type: String },
  belt: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);
