// src/routes/appointments.js
const express = require('express');
const Appointment = require('../models/appointment');
const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get an appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Add a new appointment
router.post('/', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an appointment by ID
router.patch('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete an appointment by ID
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.status(204).send();
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
