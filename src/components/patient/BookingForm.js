// src/components/patient/BookingForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/patient.css'; // Ensure correct path
import Modal from '../Modal'; // Import the universal Modal

const BookingForm = ({
  slot,
  doctors, // Array of available doctors for the selected slot
  patients,
  selectedPatient, // _id of the selected patient (or 'any')
  isAppointmentSlot,
  appointment, // Existing appointment details (if isAppointmentSlot is true)
  specialties,
  onClose,
  onBooking,        // Function to handle booking
  onEdit,           // Function to handle editing the appointment
  onCancel,         // Function to handle canceling the appointment
  updateAppointment // Function to handle updating the appointment
}) => {
  // **Booking Mode State Variables**
  const [visitDuration, setVisitDuration] = useState(30); // Default to 30 minutes
  const [doctorId, setDoctorId] = useState(
    doctors.length === 1 ? doctors[0]._id : ''
  );
  const [type, setType] = useState('');
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [end, setEndTime] = useState('');

  // **Confirmation Modal State Variables**
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Find the selected patient object by _id
  const patient = patients.find((pat) => pat._id === selectedPatient);

  // **1. Conditional Effect: Set patient details only when not editing**
  useEffect(() => {
    if (!isAppointmentSlot && patient) {
      setPatientName(patient.name || '');
      setGender(patient.gender || '');
      setAge(patient.age || '');
    }
    // If editing, these fields are set from the appointment in the next useEffect
  }, [patient, isAppointmentSlot]);

  // **2. Pre-fill form fields if editing an appointment**
  useEffect(() => {
    if (isAppointmentSlot && appointment) {
      setDoctorId(appointment.doctorId);
      setType(appointment.type);
      setPatientName(appointment.patientName);
      setGender(appointment.gender);
      setAge(appointment.age);
      setDescription(appointment.description);
      setVisitDuration(calculateDuration(appointment.start, appointment.end));
    }
  }, [isAppointmentSlot, appointment]);

  // Calculate visit duration in minutes
  const calculateDuration = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    return (endHour - startHour) * 60 + (endMinute - startMinute);
  };

  // Calculate the end time based on start time + visit duration
  useEffect(() => {
    calculateEndTime(slot.time, visitDuration);
  }, [slot.time, visitDuration]);

  const calculateEndTime = (start, duration) => {
    const [hour, minute] = start.split(':').map(Number);
    let endHour = hour;
    let endMinute = minute + duration;

    // Adjust hours/minutes as needed
    while (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }

    const formattedHour = endHour.toString().padStart(2, '0');
    const formattedMin = endMinute.toString().padStart(2, '0');
    setEndTime(`${formattedHour}:${formattedMin}`);
  };

  /**
   * Form submission handler for both booking and editing.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!doctorId || !type || !patientName || !gender || !age || !description) {
      alert(`Please fill in all fields.\nNow ${doctorId}, ${type}, ${patientName}, ${gender}, ${age}, ${description}`);
      return;
    }

    const appointmentDetails = {
      doctorId,
      patientId: selectedPatient,
      date: slot.date,
      start: slot.time,
      end,
      type,
      patientName,
      gender,
      age,
      description,
    };

    if (appointment) {
      // Editing existing appointment
      const updatedAppointment = {
        ...appointment,
        ...appointmentDetails,
      };
      await updateAppointment(updatedAppointment);
      alert('Appointment has been updated.');
    } else {
      // Booking a new appointment
      await onBooking(appointmentDetails);
      alert('Appointment added to your basket.');
    }

    onClose();
  };

  /**
   * Renders details of an existing appointment, with edit/cancel/close.
   */
  const renderManagementView = () => {
    if (!appointment) {
      return <p>No appointment data available.</p>;
    }

    // Find the relevant doctor and patient
    const doctor = doctors.find((doc) => doc._id === appointment.doctorId);
    const patientObj = patients.find((pat) => pat._id === appointment.patientId);
    const specialty = specialties.find(
      (spec) => spec.name === (doctor ? doctor.specialty : '')
    );

    return (
      <div className="appointment-details-view">
        <h2>Appointment Details</h2>
        <p>
          <strong>Date:</strong> {appointment.date}
        </p>
        <p>
          <strong>Time:</strong> {appointment.start} - {appointment.end}
        </p>
        <p>
          <strong>Doctor:</strong>{' '}
          {doctor ? doctor.name : 'Unknown'} (
          {specialty ? specialty.name : 'N/A'})
        </p>
        <p>
          <strong>Patient:</strong>{' '}
          {patientObj ? patientObj.name : 'Unknown'}
        </p>
        <p>
          <strong>Type:</strong> {appointment.type}
        </p>
        <p>
          <strong>Description:</strong> {appointment.description}
        </p>

        <div className="form-buttons">
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setIsConfirmModalOpen(true)} // Open confirmation modal
          >
            Cancel Appointment
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Confirmation Modal */}
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
          <h3>Confirm Cancellation</h3>
          <p>Are you sure you want to cancel this appointment?</p>
          <div className="confirmation-modal-buttons">
            <button className="btn btn-danger" onClick={handleConfirmCancel}>
              Confirm
            </button>
            <button className="btn btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    );
  };

  /**
   * Handles the confirmation of appointment cancellation.
   */
  const handleConfirmCancel = async () => {
    try {
      await onCancel(appointment._id); // Pass the appointment ID to the onCancel handler
      setIsConfirmModalOpen(false); // Close the confirmation modal
      onClose(); // Close the BookingForm modal
    } catch (err) {
      console.error('Error during cancellation:', err);
      alert(`Error canceling appointment: ${err.message}`);
    }
  };

  /**
   * Renders the booking/editing form.
   */
  const renderBookingForm = () => (
    <>
      <h2>{appointment ? 'Edit Appointment' : 'Book Appointment'}</h2>
      <p>
        Date: {slot.date}, Time: {slot.time} - {end}
      </p>
      <form onSubmit={handleSubmit} className="booking-form">
        {/* Visit Duration */}
        <div className="form-group">
          <label htmlFor="duration">Visit Duration:</label>
          <select
            id="duration"
            value={visitDuration}
            onChange={(e) => setVisitDuration(Number(e.target.value))}
            className="form-control"
          >
            <option value={30}>30 Minutes</option>
            <option value={60}>60 Minutes</option>
            <option value={90}>90 Minutes</option>
          </select>
        </div>

        {/* Doctor Selection (only if multiple doctors available) */}
        {doctors.length > 1 && (
          <div className="form-group">
            <label htmlFor="doctor">Select Doctor:</label>
            <select
              id="doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              required
              className="form-control"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} ({doctor.specialty})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* If only one doctor is available, just show their name */}
        {doctors.length === 1 && (
          <div className="form-group">
            <strong>Doctor:</strong> {doctors[0].name} ({doctors[0].specialty})
          </div>
        )}

        {/* Consultation Type */}
        <div className="form-group">
          <label htmlFor="type">Consultation Type:</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="form-control"
          >
            <option value="">-- Select Type --</option>
            <option value="first visit">First Visit</option>
            <option value="follow-up">Follow-Up</option>
            <option value="chronic illness">Chronic Illness</option>
            <option value="prescription">Prescription</option>
          </select>
        </div>

        {/* Patient Name */}
        <div className="form-group">
          <label htmlFor="patient-name">Patient Name:</label>
          <input
            type="text"
            id="patient-name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            className="form-control"
          />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label htmlFor="gender">Gender:</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="form-control"
          >
            <option value="">-- Select Gender --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Age */}
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            min="0"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="form-control"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description for Doctor:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="form-control"
          />
        </div>

        {/* Form Buttons */}
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {appointment ? 'Update' : 'Book'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="booking-form-container">
        {isAppointmentSlot ? renderManagementView() : renderBookingForm()}
      </div>
    </Modal>
  );
};

BookingForm.propTypes = {
  slot: PropTypes.shape({
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
  }).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  patients: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedPatient: PropTypes.string.isRequired, // The patient's _id (or 'any')
  isAppointmentSlot: PropTypes.bool.isRequired,
  appointment: PropTypes.shape({
    _id: PropTypes.string,        // Mongoose _id (not required if new)
    doctorId: PropTypes.string,   // Could be an ObjectId (stored as string)
    patientId: PropTypes.string,
    date: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    type: PropTypes.string,
    patientName: PropTypes.string,
    gender: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    status: PropTypes.string,
  }),
  specialties: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  onBooking: PropTypes.func,      // Called when creating a new appointment
  onEdit: PropTypes.func,         // Called when editing
  onCancel: PropTypes.func,       // Called when canceling
  updateAppointment: PropTypes.func,
};

BookingForm.defaultProps = {
  appointment: null,
  onBooking: () => {},
  onEdit: () => {},
  onCancel: () => {},
  updateAppointment: () => {},
};

export default BookingForm;
