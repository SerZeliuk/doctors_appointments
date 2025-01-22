const mongoose = require('mongoose');

const TimeRangeSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
});

const RecurringAvailabilitySchema = new mongoose.Schema({
  day: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  timeRanges: [TimeRangeSchema],
});

const OneTimeAvailabilitySchema = new mongoose.Schema({
  date: { type: String, required: true },
  timeRanges: [TimeRangeSchema],
});

const AbsenceSchema = new mongoose.Schema({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String },
});

const AvailabilitySchema = new mongoose.Schema({
  recurring: [RecurringAvailabilitySchema],
  one_time_availabilities: [OneTimeAvailabilitySchema],
  absences: [AbsenceSchema],
});

const DoctorSchema = new mongoose.Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  availability: { type: AvailabilitySchema, default: {} },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
