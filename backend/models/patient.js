const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  appointments: [{ type: String }], // Array of appointment IDs
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  age: { type: String, required: true },
});

module.exports = mongoose.model('Patient', PatientSchema);
