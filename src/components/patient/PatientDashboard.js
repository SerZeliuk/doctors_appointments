// src/components/patient/PatientDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import Calendar from '../calendar/Calendar';
import BookingForm from './BookingForm';
import Basket from './Basket'; // Import the Basket component
import Modal from '../Modal';  // Reuse the custom Modal component
import '../../styles/patient.css'; // Ensure correct path
import '../../styles/basket.css';  // Ensure correct path
import PropTypes from 'prop-types';
import { useAuth } from '../auth/AuthContext'; // Import the AuthContext
import { v4 as uuidv4 } from 'uuid'; // For unique local basket item IDs

const PatientDashboard = ({
  user, // { role: 'patient' | 'admin', id: 'user_id' }
  doctors,
  patients,
  appointments,
  specialties,
  addAppointment,       // Function to add appointments
  cancelAppointment,    // Function to cancel appointments
  updateAppointment,    // Function to update appointments
  setAppointments,      // Function to update the appointments state
}) => {
  
  const { currentUser, userRole } = useAuth(); // Access AuthContext
  
  // Debug: Log received props
  useEffect(() => {
    console.log('PatientDashboard Props:', {
      
      doctors,
      patients,
      appointments,
      specialties,
      addAppointment,
      cancelAppointment,
      updateAppointment,
      setAppointments,
    });
  }, [user, doctors, patients, appointments, specialties, addAppointment, cancelAppointment, updateAppointment, setAppointments]);

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctorOption, setSelectedDoctorOption] = useState('any'); // 'any' or a specific doctor _id
  const [selectedPatient, setSelectedPatient] = useState(() => {
  
    return userRole === 'patient' ? patients.find((pat) => pat.email === currentUser.email )._id : 'any';
  }); // 'any' or a specific patient _id
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAppointmentSlot, setIsAppointmentSlot] = useState(false); 
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Basket State
  const [basket, setBasket] = useState([]);
  const basketTimers = useRef({}); // Keep track of timers for each basket item

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  /**
   * Effect to filter doctors based on the selected specialty.
   */
  useEffect(() => {
    if (selectedSpecialty) {
      const doctorsBySpecialty = doctors.filter(
        (doctor) => doctor.specialty === selectedSpecialty
      );
      setFilteredDoctors(doctorsBySpecialty);
      setSelectedDoctorOption('any'); 
    } else {
      setFilteredDoctors([]);
      setSelectedDoctorOption('any');
    }
    // Reset slot-related state whenever specialty changes
    setSelectedSlot(null);
    setIsAppointmentSlot(false);
    setSelectedAppointment(null);
  }, [selectedSpecialty, doctors]);

  const handleSpecialtySelection = (e) => {
    setSelectedSpecialty(e.target.value);
  };

  const handleDoctorOptionChange = (e) => {
    setSelectedDoctorOption(e.target.value);
    setSelectedSlot(null);
    setIsAppointmentSlot(false);
    setSelectedAppointment(null);
  };

  const handlePatientSelection = (e) => {
    setSelectedPatient(e.target.value);
    console.log('Selected Patient _id:', e.target.value);
    setSelectedSlot(null);
    setIsAppointmentSlot(false);
    setSelectedAppointment(null);
  };

  /**
   * Handle when a slot on the calendar is clicked.
   * If there's a conflicting appointment, set the existing appointment for edit/cancel.
   * Otherwise, prepare to book a new appointment.
   */
  const handleSlotClick = (date, time) => {
    // Check if there's a conflicting appointment for the selected patient
    const conflictingAppointment = appointments.find(
      (apt) =>
        apt.patientId === selectedPatient &&
        apt.date === date &&
        apt.start <= time &&
        apt.end > time &&
        (apt.status === 'confirmed' || apt.status === 'in-progress')
    );
    if(userRole === 'patient'){
      console.log("User: ", currentUser);
      const selectedUser = patients.find((pat) => pat.email === currentUser.email);
      console.log("Selected User: ", selectedUser);
      console.log('Conflicting Appointment for : ', conflictingAppointment);
    }
    if (conflictingAppointment) {
      // There's a conflict => manage existing appointment
      setIsAppointmentSlot(true);
      setSelectedAppointment(conflictingAppointment);

      // Provide only the one doctor associated with the conflicting appointment
      const foundDoctor = doctors.find((doc) => doc._id === conflictingAppointment.doctorId);
      setSelectedSlot({
        date,
        time,
        availableDoctors: foundDoctor ? [foundDoctor] : [],
      });
    } else {
      // No conflict => normal booking mode
      let availableDoctors = [];

      if (selectedDoctorOption === 'any') {
        // Filter all doctors of the selected specialty, who are available
        availableDoctors = filteredDoctors.filter((doc) =>
          checkAvailability(doc, date, time, appointments)
        );
      } else {
        // Filter only the chosen doctor
        const chosenDoctor = filteredDoctors.find((doc) => doc._id === selectedDoctorOption);
        if (chosenDoctor && checkAvailability(chosenDoctor, date, time, appointments)) {
          availableDoctors = [chosenDoctor];
        }
      }

      if (availableDoctors.length === 0) {
        alert('No doctors are available at the selected time.');
        return;
      }

      setIsAppointmentSlot(false);
      setSelectedAppointment(null);
      setSelectedSlot({ date, time, availableDoctors });
    }

    setIsBookingModalOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedSlot(null);
    setIsBookingModalOpen(false);
    setIsAppointmentSlot(false);
    setSelectedAppointment(null);
  };

  /**
   * Adds a new "in-progress" appointment to the basket.
   */
  const addToBasket = async (appointmentDetails) => {
    try {
      // Force the status to 'in-progress'
      const inProgressDetails = { ...appointmentDetails, status: 'in-progress' };
      console.log('Adding to basket with details:', inProgressDetails);

      const addedAppointment = await addAppointment(inProgressDetails);
      console.log('Newly added appointment:', addedAppointment);

      if (!addedAppointment || !addedAppointment._id) {
        throw new Error('Added appointment is undefined or missing _id');
      }

      // Update the appointments state with the new appointment
      setAppointments((prevAppointments) => [...prevAppointments, addedAppointment]);

      // Create a new local basket item referencing the Mongoose _id
      const newBasketItem = {
        id: uuidv4(),         // Unique ID for local basket item
        appointmentId: addedAppointment._id,
        addedAt: Date.now(),
      };

      console.log('New Basket Item:', newBasketItem);

      setBasket((prevBasket) => [...prevBasket, newBasketItem]);

      // Start a timer (10 minutes = 600,000 ms). Here it's 60s for quick testing.
      const timerId = setTimeout(async () => {
        await removeFromBasket(newBasketItem.id, addedAppointment._id);
        alert('Basket item expired and has been removed.');
      }, 60 * 1000); // Change to 600000 for 10 minutes

      // Store the timer ID so it can be cleared if the item is removed earlier
      basketTimers.current[newBasketItem.id] = timerId;
    } catch (error) {
      console.error('Error adding to basket:', error);
      alert(`Error adding to basket: ${error.message}`);
    }
  };

  /**
   * Removes an appointment from the basket and cancels/deletes the 'in-progress' appointment.
   * @param {string} basketItemId - The unique ID of the basket item.
   * @param {string} appointmentId - The _id of the appointment to cancel.
   */
  const removeFromBasket = async (basketItemId, appointmentId) => {
    try {
      console.log(`Removing basket item ${basketItemId} and appointment ${appointmentId}...`);
      // Cancel the 'in-progress' appointment in the backend
      await cancelAppointment(appointmentId);

      // Update the appointments state to reflect the cancellation
      setAppointments((prevAppointments) =>
        prevAppointments.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: 'canceled' } : apt
        )
      );

      // Remove the basket item locally
      setBasket((prevBasket) => prevBasket.filter((item) => item.id !== basketItemId));

      // Clear the timer for this basket item
      if (basketTimers.current[basketItemId]) {
        clearTimeout(basketTimers.current[basketItemId]);
        delete basketTimers.current[basketItemId];
      }

      alert(`Removed basket item ${basketItemId} and appointment ${appointmentId}.`);
      console.log(`Removed basket item ${basketItemId} and appointment ${appointmentId}.`);
    } catch (error) {
      console.error('Error removing from basket:', error);
      alert(`Error removing basket item: ${error.message}`);
    }
  };

  /**
   * Checkout initiates the payment modal if the basket has items.
   */
  const handleCheckout = () => {
    if (basket.length === 0) {
      alert('Your basket is empty.');
      return;
    }
    setPaymentModalOpen(true);
  };

  /**
   * Simulate a payment process.
   */
  const simulatePayment = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };

  /**
   * Confirms payment, updates all 'in-progress' appointments to 'confirmed'.
   */
  const handleConfirmPayment = async () => {
    try {
      const paymentSuccess = await simulatePayment();
      if (paymentSuccess) {
        // Confirm each appointment in the basket
        const updatedAppointments = [];
        for (let item of basket) {
          const aptId = item.appointmentId;
          const appointmentToConfirm = appointments.find((apt) => apt._id === aptId);

          if (appointmentToConfirm) {
            const updatedAppointment = {
              ...appointmentToConfirm,
              status: 'confirmed',
            };
            await updateAppointment(updatedAppointment);
            updatedAppointments.push(updatedAppointment);
          }
        }

        // Update the appointments state with confirmed appointments
        setAppointments((prevAppointments) =>
          prevAppointments.map((apt) => {
            const confirmedApt = updatedAppointments.find((cApt) => cApt._id === apt._id);
            return confirmedApt ? confirmedApt : apt;
          })
        );

        // Clear the basket and timers
        for (let item of basket) {
          if (basketTimers.current[item.id]) {
            clearTimeout(basketTimers.current[item.id]);
            delete basketTimers.current[item.id];
          }
        }
        setBasket([]);

        alert('Payment successful! Your appointments have been confirmed.');
        setPaymentModalOpen(false);
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('An error occurred during payment. Please try again.');
    }
  };

  const handleCancelPayment = () => {
    setPaymentModalOpen(false);
  };

  /**
   * Cleanup timers on component unmount.
   */
  useEffect(() => {
    return () => {
      Object.values(basketTimers.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  /**
   * Determine which appointments to show based on the selected patient.
   */
  const displayedAppointments = appointments.filter((apt) => {
    const isConfirmedOrInProgress =
      apt.status === 'confirmed' || apt.status === 'in-progress';
    const matchesPatient = selectedPatient === 'any' || apt.patientId === selectedPatient;
    return isConfirmedOrInProgress && matchesPatient;
  });

  /**
   * Handle editing an appointment (sets the form into edit mode).
   */
  const handleEdit = (appointmentToEdit) => {
    const { date, start, end, doctorId } = appointmentToEdit;
    setIsAppointmentSlot(false);
    setSelectedAppointment(appointmentToEdit);

    const foundDoctor = doctors.find((doc) => doc._id === doctorId);
    setSelectedSlot({
      date,
      time: start,
      availableDoctors: foundDoctor ? [foundDoctor] : [],
    });

    setIsBookingModalOpen(true);
  };

  /**
   * Handle canceling an appointment.
   */
  const handleCancelAppointment = async (appointmentToCancel) => {
    console.log('Cancelling appointment:', appointmentToCancel);
    try {
      await cancelAppointment(appointmentToCancel._id);

      // Update the appointments state to reflect the cancellation
      setAppointments((prevAppointments) =>
        prevAppointments.map((apt) =>
          apt._id === appointmentToCancel._id ? { ...apt, status: 'canceled' } : apt
        )
      );

      alert('Appointment has been canceled.');
    } catch (error) {
      console.error('Cancellation Error:', error);
      alert('Failed to cancel the appointment. Please try again.');
    }
    handleCloseForm();
  };

  return (
    <div className="patient-dashboard container mt-4">
      <h2 className="mb-4">Patient Dashboard</h2>

      {/* Specialty Selection */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="form-group">
            <label htmlFor="specialty"><strong>Select Specialty:</strong></label>
            <select
              id="specialty"
              value={selectedSpecialty}
              onChange={handleSpecialtySelection}
              className="form-control"
            >
              <option value="">-- Select Specialty --</option>
              {specialties.map((specialty, index) => (
                <option key={index} value={specialty.name}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Option Selection */}
        {selectedSpecialty && (
          <div className="col-md-4">
            <div className="form-group">
              <label htmlFor="doctor-option"><strong>Select Doctor:</strong></label>
              <select
                id="doctor-option"
                value={selectedDoctorOption}
                onChange={handleDoctorOptionChange}
                className="form-control"
              >
                <option value="any">Any Doctor</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Patient Selection - Only for Admin */}
        {userRole === 'admin' && (
          <div className="col-md-4">
            <div className="form-group">
              <label htmlFor="patient-option"><strong>Select Patient:</strong></label>
              <select
                id="patient-option"
                value={selectedPatient}
                onChange={handlePatientSelection}
                className="form-control"
              >
                <option value="any">-- All Patients --</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Display */}
      {(selectedSpecialty || (userRole === 'admin' && selectedPatient !== 'any')) && (
        <section className="dashboard-section mb-4">
          <h3>
            View {selectedDoctorOption === 'any' ? selectedSpecialty : 'Doctor'} Availability
            {userRole === 'admin' && selectedPatient !== 'any' &&
              ` for ${
                patients.find((p) => p._id === selectedPatient)?.name || 'Selected Patient'
              }`}
          </h3>
          <Calendar
            selectedDoctors={
              selectedDoctorOption === 'any'
                ? filteredDoctors
                : filteredDoctors.filter((doc) => doc._id === selectedDoctorOption)
            }
            selectedPatient={selectedPatient}
            appointments={displayedAppointments}
            onSlotClick={handleSlotClick}
            dashboardType="patient"
            specialties={specialties}
            patients={patients}
            doctors={doctors}
          />
        </section>
      )}

      {/* Basket Display */}
      {basket.length > 0 && (
        <Basket
          basket={basket.map((item) => {
            const appointment = appointments.find((apt) => apt._id === item.appointmentId) || {};
            const doctor = doctors.find((doc) => doc._id === appointment.doctorId) || {};
            const patient = patients.find((pat) => pat._id === appointment.patientId) || {};

            return {
              ...item,
              date: appointment.date || 'N/A',
              start: appointment.start || 'N/A',
              end: appointment.end || 'N/A',
              status: appointment.status || 'N/A',
              doctorName: doctor.name || 'Unknown',
              patientName: patient.name || 'Unknown',
            };
          })}
          removeFromBasket={removeFromBasket}
          handleCheckout={handleCheckout}
        />
      )}

      {/* Booking Modal */}
      <Modal isOpen={isBookingModalOpen} onClose={handleCloseForm}>
        {selectedSlot && (
          <BookingForm
            slot={selectedSlot}
            doctors={selectedSlot.availableDoctors}
            patients={patients}
            isAppointmentSlot={isAppointmentSlot}
            appointment={selectedAppointment}
            selectedPatient={selectedPatient}
            specialties={specialties}
            onClose={handleCloseForm}
            onBooking={!isAppointmentSlot ? addToBasket : null}
            onEdit={isAppointmentSlot ? () => handleEdit(selectedAppointment) : null}
            onCancel={isAppointmentSlot ? () => handleCancelAppointment(selectedAppointment) : null}
            updateAppointment={updateAppointment}
          />
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={paymentModalOpen} onClose={handleCancelPayment} className="payment-modal">
        <h2>Payment Confirmation</h2>
        <p>Do you want to proceed with the payment?</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-secondary mr-2" onClick={handleCancelPayment}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirmPayment}>
            Confirm Payment
          </button>
        </div>
      </Modal>
    </div>
  );
};

PatientDashboard.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.oneOf(['patient', 'admin']).isRequired,
    id: PropTypes.string, // Required if role is 'patient'
  }).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  patients: PropTypes.arrayOf(PropTypes.object).isRequired,
  appointments: PropTypes.arrayOf(PropTypes.object).isRequired,
  specialties: PropTypes.arrayOf(PropTypes.object).isRequired,
  addAppointment: PropTypes.func.isRequired,
  cancelAppointment: PropTypes.func.isRequired,
  updateAppointment: PropTypes.func.isRequired,
  setAppointments: PropTypes.func.isRequired, // Added PropType for setAppointments
};

/**
 * Checks if the given doctor is available on a specific day/slot.
 * Adjust if your Appointment schema uses ObjectId references instead of strings.
 */
function checkAvailability(doctor, day, slot, appointments) {
  const dayOfWeek = new Date(day).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  // 1. Check for conflicting appointments
  const isSlotTaken = appointments.some(
    (app) =>
      app.doctorId === doctor._id && 
      app.date === day &&
      slot >= app.start &&
      slot < app.end &&
      (app.status === 'confirmed' || app.status === 'in-progress')
  );
  if (isSlotTaken) return false;

  // 2. Check if the doctor is absent on this day
  const isAbsent = doctor.availability?.absences?.some((abs) => abs.date === day);
  if (isAbsent) return false;

  // 3. Check one-time availabilities
  const oneTimeAvailabilities = doctor.availability?.one_time_availabilities?.filter(
    (av) => av.date === day
  ) || [];
  for (let av of oneTimeAvailabilities) {
    for (let tr of av.timeRanges) {
      if (slot >= tr.start && slot < tr.end) {
        return true;
      }
    }
  }

  // 4. Check recurring availabilities
  const recurringAvailabilities = doctor.availability?.recurring?.filter(
    (rec) =>
      rec.day === dayOfWeek &&
      new Date(rec.startDate) <= new Date(day) &&
      new Date(rec.endDate) >= new Date(day)
  ) || [];
  for (let rec_av of recurringAvailabilities) {
    for (let tr of rec_av.timeRanges) {
      if (slot >= tr.start && slot < tr.end) {
        return true;
      }
    }
  }

  return false;
}

export default PatientDashboard;
