// src/routes/patients.js
const express = require('express');
const Patient = require('../models/patient');
const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Add a new patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a patient by ID
router.patch('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a patient by ID
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.status(204).send();
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
  