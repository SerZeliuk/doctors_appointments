// Switch to the "test" database
use('test');

// View indexes for each collection after dropping 'id_1'
const doctorsIndexes = db.doctors.getIndexes();
const appointmentsIndexes = db.appointments.getIndexes();
const patientsIndexes = db.patients.getIndexes();
const specialtiesIndexes = db.specialties.getIndexes();

({
  doctorsIndexes,
  appointmentsIndexes,
  patientsIndexes,
  specialtiesIndexes
});
