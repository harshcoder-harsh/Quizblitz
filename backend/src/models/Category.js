const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  slug: { type: String, unique: true, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});

module.exports = mongoose.model('Category', categorySchema);
