// src/routes/specialties.js
const express = require('express');
const Specialty = require('../models/specialty');
const router = express.Router();

// Get all specialties
router.get('/', async (req, res) => {
  try {
    const specialties = await Specialty.find();
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single specialty by ID
router.get('/:id', async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return res.status(404).json({ error: 'Specialty not found' });
    res.json(specialty);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid specialty ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Add a new specialty
router.post('/', async (req, res) => {
  try {
    const specialty = new Specialty(req.body);
    await specialty.save();
    res.status(201).json(specialty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a specialty by ID
router.patch('/:id', async (req, res) => {
  try {
    const specialty = await Specialty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!specialty) return res.status(404).json({ error: 'Specialty not found' });
    res.json(specialty);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid specialty ID format' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a specialty by ID
router.delete('/:id', async (req, res) => {
  try {
    const specialty = await Specialty.findByIdAndDelete(req.params.id);
    if (!specialty) return res.status(404).json({ error: 'Specialty not found' });
    res.status(204).send();
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid specialty ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
