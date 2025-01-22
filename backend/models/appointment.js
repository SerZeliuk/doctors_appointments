const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  // id: { type: String, required: true, unique: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  date: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['confirmed', 'in-progress', 'canceled'], required: true },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
