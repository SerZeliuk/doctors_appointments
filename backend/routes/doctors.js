// src/routes/doctors.js
const express = require('express');
const Doctor = require('../models/doctor');
const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Add a new doctor
router.post('/', async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a doctor by ID
router.patch('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a doctor by ID
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.status(204).send();
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
