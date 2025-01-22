// src/firebase/migrateData.js
import { getDatabase, ref, get, update } from 'firebase/database';
import { database as db} from './config.js';
// import { getData, addData, updateData, removeData } from '../../firebase/utils';

/**
 * Migrate Patients to use `_id` as the key.
 */
// const migratePatients = async () => {
//   // const db = getDatabase();
//   const patientsSnapshot = await get(ref(db, 'patients'));
  
//   if (patientsSnapshot.exists()) {
//     const patientsData = patientsSnapshot.val();
//     const updates = {};

//     Object.entries(patientsData).forEach(([key, patient]) => {
//       if (patient._id) {
//         updates[`patients/${patient._id}`] = {
//           age: patient.age,
//           appointments: patient.appointments || [],
//           gender: patient.gender,
//           name: patient.name
//         };
//         updates[`patients/${key}`] = null; // Remove old entry
//       }
//     });

//     await update(ref(db), updates);
//     console.log('Patients migration completed successfully.');
//   } else {
//     console.log('No patients found to migrate.');
//   }
// };

/**
 * Migrate Doctors to use `_id` as the key.
 */
const migrateDoctors = async () => {
  const db = getDatabase();
  const doctorsSnapshot = await get(ref(db, 'doctors'));
  
  if (doctorsSnapshot.exists()) {
    const doctorsData = doctorsSnapshot.val();
    const updates = {};

    Object.entries(doctorsData).forEach(([key, doctor]) => {
      if (doctor._id) {
        updates[`doctors/${doctor._id}`] = {
          specialty: doctor.specialty,
          name: doctor.name,
          availability: doctor.availability || {}
          // Add other relevant fields here
        };
        updates[`doctors/${key}`] = null; // Remove old entry
      }
    });

    await update(ref(db), updates);
    console.log('Doctors migration completed successfully.');
  } else {
    console.log('No doctors found to migrate.');
  }
};

/**
 * Migrate Appointments to use `_id` as the key.
 */
const migrateAppointments = async () => {
  const db = getDatabase();
  const appointmentsSnapshot = await get(ref(db, 'appointments'));
  
  if (appointmentsSnapshot.exists()) {
    const appointmentsData = appointmentsSnapshot.val();
    const updates = {};

    Object.entries(appointmentsData).forEach(([key, appointment]) => {
      if (appointment._id) {
        updates[`appointments/${appointment._id}`] = {
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          date: appointment.date,
          start: appointment.start,
          end: appointment.end,
          type: appointment.type,
          description: appointment.description || '',
          status: appointment.status || 'confirmed',
          createdAt: appointment.createdAt || new Date().toISOString()
          // Add other relevant fields here
        };
        updates[`appointments/${key}`] = null; // Remove old entry
      }
    });

    await update(ref(db), updates);
    console.log('Appointments migration completed successfully.');
  } else {
    console.log('No appointments found to migrate.');
  }
};

/**
 * Execute all migration functions sequentially.
 */
const migrateAll = async () => {
  try {
    console.log('Starting migration process...');
    // await migratePatients();
    await migrateDoctors();
    console.log('Doctors migration completed successfully.');
    await migrateAppointments();
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Execute migration (Run this once)
// Uncomment the line below to run the migration.
migrateAll();
