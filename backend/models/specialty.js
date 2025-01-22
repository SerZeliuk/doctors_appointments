const mongoose = require('mongoose');

const SpecialtySchema = new mongoose.Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
});

module.exports = mongoose.model('Specialty', SpecialtySchema);
