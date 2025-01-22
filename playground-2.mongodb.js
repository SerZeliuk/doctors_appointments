// Switch to the "test" database
use('test');

// Function to log messages with a timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Function to update appointments
const updateAppointments = async () => {
  log('Starting appointment updates...');

  const appointments = await db.appointments.find().toArray();
  log(`Found ${appointments.length} appointments to process.`);

  for (const appointment of appointments) {
    const { _id, doctorId, patientId, id } = appointment;

    // Check if doctorId and patientId are already ObjectIds
    const isDoctorIdObjectId = typeof doctorId === 'object' && doctorId !== null && doctorId.hasOwnProperty('$oid');
    const isPatientIdObjectId = typeof patientId === 'object' && patientId !== null && patientId.hasOwnProperty('$oid');

    if (isDoctorIdObjectId && isPatientIdObjectId) {
      log(`Appointment ${_id} already uses _id references. Skipping.`);
      continue;
    }

    // Find the doctor by custom id
    const doctor = await db.doctors.findOne({ id: doctorId });
    if (!doctor) {
      log(`Doctor with id "${doctorId}" not found for appointment ${_id}. Skipping.`);
      continue;
    }

    // Find the patient by custom id
    const patient = await db.patients.findOne({ id: patientId });
    if (!patient) {
      log(`Patient with id "${patientId}" not found for appointment ${_id}. Skipping.`);
      continue;
    }

    // Update the appointment's doctorId and patientId to _id references
    const updatedAppointment = {
      doctorId: doctor._id,
      patientId: patient._id,
    };

    // Prepare the update operations
    const updateOperations = {
      $set: {
        doctorId: doctor._id,
        patientId: patient._id,
      },
      $unset: {
        id: "",
      },
    };

    // Perform the update
    const result = await db.appointments.updateOne({ _id }, updateOperations);

    if (result.modifiedCount === 1) {
      log(`Updated appointment ${_id}: doctorId and patientId set to _id references.`);

      // Optionally, update the patient's appointments array if it contains appointment ids
      if (patient.appointments && Array.isArray(patient.appointments)) {
        // Replace 'apt-1' with the actual _id
        const index = patient.appointments.indexOf(id);
        if (index !== -1) {
          patient.appointments[index] = _id;
          await db.patients.updateOne(
            { _id: patient._id },
            { $set: { appointments: patient.appointments } }
          );
          log(`Updated patient's appointments array for patient ${patient._id}.`);
        }
      }

    } else {
      log(`Failed to update appointment ${_id}.`);
    }
  }

  log('Appointment updates completed.');
};

// Function to remove 'id' fields from doctors and patients
const removeCustomIds = async () => {
  log('Starting removal of custom "id" fields from doctors and patients...');

  const collections = ['doctors', 'patients'];

  for (const collectionName of collections) {
    const count = await db[collectionName].countDocuments({ id: { $exists: true } });
    if (count === 0) {
      log(`No documents with 'id' field found in ${collectionName}. Skipping.`);
      continue;
    }

    const result = await db[collectionName].updateMany(
      { id: { $exists: true } },
      { $unset: { id: "" } }
    );

    log(`Removed 'id' field from ${result.modifiedCount} documents in ${collectionName}.`);
  }

  log('Removal of custom "id" fields completed.');
};

// Function to remove 'id' fields from appointments (optional)
const removeIdFromAppointments = async () => {
  log('Starting removal of custom "id" fields from appointments...');

  const count = await db.appointments.countDocuments({ id: { $exists: true } });
  if (count === 0) {
    log(`No documents with 'id' field found in appointments. Skipping.`);
    return;
  }

  const result = await db.appointments.updateMany(
    { id: { $exists: true } },
    { $unset: { id: "" } }
  );

  log(`Removed 'id' field from ${result.modifiedCount} documents in appointments.`);
  log('Removal of custom "id" fields from appointments completed.');
};

// Main execution function
const runMigration = async () => {
  try {
    await updateAppointments();
    await removeCustomIds();
    await removeIdFromAppointments(); // Optional: Remove 'id' from appointments if not already done
    log('Migration completed successfully.');
  } catch (err) {
    log(`Migration failed: ${err}`);
  }
};

// Execute the migration
runMigration();
