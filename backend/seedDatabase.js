const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Load models
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Specialty = require('./models/Specialty');

// Load JSON data
const data = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Doctor.deleteMany();
    await Patient.deleteMany();
    await Appointment.deleteMany();
    await Specialty.deleteMany();

    console.log('Cleared existing data.');

    // Insert new data
    await Doctor.insertMany(data.doctors);
    await Patient.insertMany(data.patients);
    await Appointment.insertMany(data.appointments);
    await Specialty.insertMany(data.specialties);

    console.log('Database seeded successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
  }
};

// Run the seeding process
seedDatabase();
