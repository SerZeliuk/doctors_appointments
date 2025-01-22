// src/components/doctor/DoctorDashboard.js
import React, { useState, useEffect } from 'react';
import AvailabilityForm from './AvailabilityForm'; // Ensure correct path
import AbsenceForm from './AbsenceForm'; // Ensure correct path
import Calendar from '../calendar/Calendar'; // Ensure correct path
import Modal from '../Modal'; // Ensure correct path
import { generateWeekDays } from '../../utils/dateUtils'; // Ensure correct path
import { getData, setData, updateData, removeData } from '../../firebase/firebaseUtils'; // Ensure correct path
import '../../styles/doctor.css'; // Ensure correct path
import PropTypes from 'prop-types';
import { firebaseLink } from '../../dataSource'; // Ensure correct path
import { useAuth } from '../auth/AuthContext'; // Import useAuth hook

const DoctorDashboard = ({
  doctors,
  appointments,
  setAppointments,
  updateAppointment,
  cancelAppointment,
  specialties,
  patients,
  dataSource,
}) => {
  const { currentUser, userRole } = useAuth(); // Access AuthContext

  // Initialize selectedDoctorId based on user role
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (userRole === 'doctor' && currentUser) {
      const docId = doctors.find((doc) => doc.email === currentUser.email)?._id;
      return docId; // Assuming doctor's _id is their Firebase UID
    }
    return doctors[0]?._id || '';
  });

  const [ doctor, setDoctor] = useState(() => {
    return doctors.find((doc) => doc._id === selectedDoctorId) || {};
  });

  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedSortOption, setSelectedSortOption] = useState('dateAsc'); // Default sort option
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  /**
   * Effect to set the selected doctor based on selectedDoctorId.
   */
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError(null);
      try {
        const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);
        if (!selectedDoctor) {
          throw new Error('Selected doctor not found.');
        }
        setDoctor(selectedDoctor);
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDoctorId) {
      fetchDoctor();
    }
  }, [selectedDoctorId, doctors]);

  /**
   * Handler for date selection change.
   */
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  /**
   * Handler for sort option change.
   */
  const handleSortChange = (e) => {
    setSelectedSortOption(e.target.value);
  };

  /**
   * Generate unique sorted date options from appointments.
   */
  const generateDateOptions = () => {
    const dates = appointments
      .filter((apt) => apt.doctorId === doctor._id) // Ensure appointments belong to the selected doctor
      .map((apt) => apt.date);
    const uniqueDates = [...new Set(dates)];
    uniqueDates.sort(); // Sort dates in ascending order
    return uniqueDates;
  };

  /**
   * Filter appointments based on selectedDate.
   */
  const getFilteredAppointments = () => {
    if (selectedDate === 'all') {
      return appointments.filter((apt) => apt.doctorId === doctor._id);
    }
    return appointments.filter(
      (apt) => apt.date === selectedDate && apt.doctorId === doctor._id
    );
  };

  /**
   * Sort appointments based on selectedSortOption.
   */
  const getSortedAppointments = (filteredAppointments) => {
    const sorted = [...filteredAppointments];
    switch (selectedSortOption) {
      case 'dateAsc':
        sorted.sort((a, b) => {
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;
          // If dates are equal, sort by start time
          if (a.start < b.start) return -1;
          if (a.start > b.start) return 1;
          return 0;
        });
        break;
      case 'dateDesc':
        sorted.sort((a, b) => {
          if (a.date > b.date) return -1;
          if (a.date < b.date) return 1;
          // If dates are equal, sort by start time descending
          if (a.start > b.start) return -1;
          if (a.start < b.start) return 1;
          return 0;
        });
        break;
      case 'statusAsc':
        sorted.sort((a, b) => {
          const statusA = a.status.toLowerCase();
          const statusB = b.status.toLowerCase();
          if (statusA < statusB) return -1;
          if (statusA > statusB) return 1;
          return 0;
        });
        break;
      case 'statusDesc':
        sorted.sort((a, b) => {
          const statusA = a.status.toLowerCase();
          const statusB = b.status.toLowerCase();
          if (statusA > statusB) return -1;
          if (statusA < statusB) return 1;
          return 0;
        });
        break;
      default:
        break;
    }
    return sorted;
  };

  // Get filtered and sorted appointments
  const filteredAppointments = getFilteredAppointments();
  const sortedAppointments = getSortedAppointments(filteredAppointments);

  /**
   * Update doctor's availability.
   */
  const handleUpdateAvailability = async (updatedAvailability) => {
    const newAvailability = {
      ...doctor.availability,
      ...updatedAvailability,
    };

    if (dataSource === firebaseLink) {
      try {
        console.log('Doctor Availability:', newAvailability);
        await updateData(`doctors/${doctor._id}/availability`, newAvailability);
        setDoctor({ ...doctor, availability: newAvailability });
        setIsAvailabilityModalOpen(false);
        alert('Availability updated successfully!');
      } catch (error) {
        console.error('Error updating availability:', error);
        alert('Failed to update availability.');
      }
    } else {
      // Handle REST API Update
      try {
        const response = await fetch(`${dataSource}/doctors/${doctor._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availability: newAvailability }),
        });

        if (!response.ok) {
          throw new Error('Failed to update availability');
        }

        const updatedDoctor = await response.json();
        setDoctor(updatedDoctor);
        setIsAvailabilityModalOpen(false);
        alert('Availability updated successfully!');
      } catch (error) {
        console.error('API Error updating availability:', error);
        alert('Failed to update availability (API).');
      }
    }
  };

  /**
   * Add Absences and Cancel Conflicting Appointments.
   * @param {Array} updatedAbsences - New or updated absences.
   * @param {Array} deletedAbsenceIds - IDs of absences to delete.
   * @param {Array} appointmentsToCancel - Appointments that conflict with new absences.
   */
  const handleAddAbsences = async (
    updatedAbsences,
    deletedAbsenceIds,
    appointmentsToCancel
  ) => {
    if (dataSource === firebaseLink) {
      try {
        // Step 1: Delete absences marked for deletion
        if (deletedAbsenceIds.length > 0) {
          const currentAbsences = await getData(`doctors/${doctor._id}/availability/absences`) || [];

          // Remove the specified absences
          const remainingAbsences = currentAbsences.filter(
            (abs) => !deletedAbsenceIds.includes(abs._id)
          );

          // Update absences in Firebase
          await updateData(`doctors/${doctor._id}/availability`, {
            absences: remainingAbsences,
          });
          console.log('Deleted specified absences in Firebase.');
        }

         // Step 2: Add or update absences
         if (updatedAbsences.length > 0) {
          // Ensure each absence does not have an _id if it's not necessary
          const sanitizedAbsences = updatedAbsences.map(({ _id, ...rest }) => rest);

          await updateData(`doctors/${doctor._id}/availability`, {
            absences: sanitizedAbsences
          });
          console.log('Updated absences in Firebase.');
        }

        // Step 3: Cancel conflicting appointments
        if (appointmentsToCancel.length > 0) {
          const updates = {};
          appointmentsToCancel.forEach((apt) => {
            updates[`appointments/${apt._id}/status`] = 'canceled';
          });
          await updateData('/', updates); // Ensure updateData can handle multi-path updates
          console.log('Canceled conflicting appointments in Firebase.');

          // Update local state
          setAppointments((prev) =>
            prev.map((apt) =>
              appointmentsToCancel.find((cApt) => cApt._id === apt._id)
                ? { ...apt, status: 'canceled' }
                : apt
            )
          );
        }

        // Refresh doctor data
        const refreshedDoctor = await getData(`doctors/${doctor._id}`);
        setDoctor({ ...doctor, availability: refreshedDoctor.availability });
        setIsAbsenceModalOpen(false);
        alert('Absences and conflicting appointments updated successfully!');
      } catch (error) {
        console.error('Firebase Error updating absences:', error);
        alert('Failed to update absences and conflicting appointments (Firebase).');
      }
    } else {
      // Handle REST API Update
      try {
        const response = await fetch(`${dataSource}/doctors/${doctor._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availability: { absences: updatedAbsences } }),
        });

        if (!response.ok) {
          throw new Error('Failed to update absences');
        }

        const updatedDoctor = await response.json();
        setDoctor(updatedDoctor);
        alert('Absences updated successfully (API)!');

        // Cancel Conflicting Appointments via API
        if (appointmentsToCancel.length > 0) {
          for (let apt of appointmentsToCancel) {
            const res = await fetch(`${dataSource}/appointments/${apt._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'canceled' }),
            });
            if (!res.ok) {
              throw new Error(`Failed to cancel appointment ${apt._id}`);
            }
            const updatedApt = await res.json();
            setAppointments((prev) =>
              prev.map((a) => (a._id === updatedApt._id ? updatedApt : a))
            );
          }
          alert('Conflicting appointments canceled successfully (API)!');
        }

        setIsAbsenceModalOpen(false);
      } catch (error) {
        console.error('API Error updating absences:', error);
        alert('Failed to update absences (API).');
      }
    }
  };

  /**
   * Handler to delete an appointment.
   * @param {string} appointmentId - The _id of the appointment to delete.
   */
  const handleDeleteAppointment = async (appointmentId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this appointment permanently?'
    );
    if (!confirmDelete) return;

    if (dataSource === firebaseLink) {
      try {
        await removeData(`appointments/${appointmentId}`);
        setAppointments((prev) => prev.filter((apt) => apt._id !== appointmentId));
        alert('Appointment deleted successfully (Firebase)!');
      } catch (error) {
        console.error('Firebase Error deleting appointment:', error);
        alert('Failed to delete appointment (Firebase).');
      }
    } else {
      // Handle REST API Delete
      try {
        const response = await fetch(`${dataSource}/appointments/${appointmentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete appointment.');
        }

        setAppointments((prev) => prev.filter((apt) => apt._id !== appointmentId));
        alert('Appointment deleted successfully!');
      } catch (error) {
        console.error('API Error deleting appointment:', error);
        alert('Failed to delete appointment (API).');
      }
    }
  };

  /**
   * Utility function to determine if an appointment is in the past or canceled.
   * @param {string} date - The date of the appointment in 'YYYY-MM-DD' format.
   * @param {string} start - The start time of the appointment in 'HH:MM' format.
   * @param {string} status - The status of the appointment.
   * @returns {boolean} - True if the appointment is in the past or canceled, else false.
   */
  const isAppointmentInPastOrCanceled = (date, start, status) => {
    const appointmentDateTime = new Date(`${date}T${start}`);
    const now = new Date();
    return appointmentDateTime < now || status === 'canceled';
  };

  /**
   * Generate a unique ID for absences.
   * Replace this with a more robust solution (e.g., UUID) if necessary.
   */
  const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Filter appointments for the selected doctor.
   */
  const doctorAppointments = sortedAppointments; // Already filtered and sorted

  /**
   * Render loading and error states
   */
  if (loading) {
    return <div className="container mt-4">Loading doctor information...</div>;
  }

  if (error) {
    return <div className="container mt-4 text-danger">Error: {error}</div>;
  }

  return (
    <div className="doctor-dashboard container mt-4">
      <h2>Doctor Dashboard</h2>

      {/* Doctor Selection - Only visible to admins */}
      {userRole === 'admin' && (
        <div className="doctor-selection mb-3">
          <label htmlFor="doctor-select" className="mr-2">
            <strong>Select Doctor:</strong>
          </label>
          <select
            id="doctor-select"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="form-control d-inline-block w-auto"
          >
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} ({doc.specialty})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons to Open Modals */}
      <div className="dashboard-buttons mb-4">
        <button
          onClick={() => setIsAvailabilityModalOpen(true)}
          className="btn btn-primary mr-2"
        >
          Define Availability
        </button>
        <button
          onClick={() => setIsAbsenceModalOpen(true)}
          className="btn btn-secondary"
        >
          Manage Absences
        </button>
      </div>

      {/* Availability Modal */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
      >
        <AvailabilityForm
          onSubmit={handleUpdateAvailability}
          specialties={specialties}
          existingAvailability={doctor.availability} // Pass existing availability data
        />
      </Modal>

      {/* Absence Modal */}
      <Modal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
      >
        <AbsenceForm
          doctorId={selectedDoctorId}
          onSubmit={handleAddAbsences}
          appointments={appointments.filter(
            (apt) => apt.doctorId === selectedDoctorId
          )}
          patients={patients}
          existingAbsences={doctor.availability?.absences || []} // Pass existing absences
        />
      </Modal>

      {/* Filters */}
      <div className="row mb-3">
        {/* Date Selection */}
        <div className="col-md-6 mb-2">
          <div className="form-group">
            <label htmlFor="date-select">
              <strong>Select Date:</strong>
            </label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={handleDateChange}
              className="form-control"
            >
              <option value="all">All Dates</option>
              {generateDateOptions().map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="col-md-6 mb-2">
          <div className="form-group">
            <label htmlFor="sort-select">
              <strong>Sort By:</strong>
            </label>
            <select
              id="sort-select"
              value={selectedSortOption}
              onChange={handleSortChange}
              className="form-control"
            >
              <option value="dateAsc">Date (Oldest First)</option>
              <option value="dateDesc">Date (Newest First)</option>
              <option value="statusAsc">Status (A-Z)</option>
              <option value="statusDesc">Status (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctor's Schedule */}
      <section className="dashboard-section mb-4">
        <h3>Your Schedule</h3>
        <Calendar
          weekDays={generateWeekDays()} // Implement this function to provide an array of Date objects for the week
          selectedDoctors={[doctor]}
          appointments={doctorAppointments}
          onSlotClick={() => {}} // Doctors shouldn't book appointments
          dashboardType="doctor"
          specialties={specialties}
          patients={patients}
          doctors={doctors}
        />
      </section>

      {/* Appointments Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered">
          <thead className="thead-dark">
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Time</th>
              <th scope="col">Patient Name</th>
              <th scope="col">Gender</th>
              <th scope="col">Age</th>
              <th scope="col">Type</th>
              <th scope="col">Description</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctorAppointments.length > 0 ? (
              doctorAppointments.map((apt) => {
                const patient = patients.find((p) => p._id === apt.patientId);
                const inPastOrCanceled = isAppointmentInPastOrCanceled(
                  apt.date,
                  apt.start,
                  apt.status
                );

                // Define badge colors based on status
                let statusBadge = 'secondary';
                if (apt.status === 'confirmed') {
                  statusBadge = 'success';
                } else if (apt.status === 'canceled') {
                  statusBadge = 'danger';
                } else if (apt.status === 'pending') {
                  statusBadge = 'warning';
                }

                return (
                  <tr key={apt._id}>
                    <td>
                      {new Date(apt.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      {apt.start} - {apt.end}
                    </td>
                    <td>
                      {patient ? patient.name : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </td>
                    <td>
                      {patient ? patient.gender : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </td>
                    <td>
                      {patient ? patient.age : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </td>
                    <td>{apt.type}</td>
                    <td>{apt.description}</td>
                    <td>
                      <span className={`badge badge-${statusBadge}`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {inPastOrCanceled && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteAppointment(apt._id)}
                          title="Delete Appointment"
                        >
                          &#10005;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted">
                  No appointments found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DoctorDashboard.propTypes = {
  doctors: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      specialty: PropTypes.string.isRequired,
      availability: PropTypes.shape({
        recurring: PropTypes.arrayOf(
          PropTypes.shape({
            day: PropTypes.string.isRequired, // e.g., 'monday'
            timeRanges: PropTypes.arrayOf(
              PropTypes.shape({
                start: PropTypes.string.isRequired, // 'HH:MM'
                end: PropTypes.string.isRequired, // 'HH:MM'
              })
            ),
            startDate: PropTypes.string, // 'YYYY-MM-DD'
            endDate: PropTypes.string, // 'YYYY-MM-DD'
          })
        ),
        one_time_availabilities: PropTypes.arrayOf(
          PropTypes.shape({
            date: PropTypes.string.isRequired, // 'YYYY-MM-DD'
            timeRanges: PropTypes.arrayOf(
              PropTypes.shape({
                start: PropTypes.string.isRequired, // 'HH:MM'
                end: PropTypes.string.isRequired, // 'HH:MM'
              })
            ),
          })
        ),
        absences: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.string, // Unique ID for absence
            date: PropTypes.string.isRequired, // 'YYYY-MM-DD'
          })
        ),
      }),
      email: PropTypes.string.isRequired,
      // Add other relevant fields
    })
  ).isRequired,
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      doctorId: PropTypes.string.isRequired,
      patientId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired, // 'YYYY-MM-DD'
      start: PropTypes.string.isRequired, // 'HH:MM'
      end: PropTypes.string.isRequired, // 'HH:MM'
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.string.isRequired, // e.g., 'confirmed', 'canceled', 'pending'
      // Add other relevant fields
    })
  ).isRequired,
  setAppointments: PropTypes.func.isRequired,
  specialties: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      // Add other relevant fields
    })
  ).isRequired,
  patients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      gender: PropTypes.string.isRequired,
      age: PropTypes.number.isRequired,
      appointments: PropTypes.arrayOf(PropTypes.string), // Array of appointment _ids
      email: PropTypes.string.isRequired,
      // Add other relevant fields
    })
  ).isRequired,
  dataSource: PropTypes.string.isRequired, // Either 'localLink' or 'firebaseLink'
};

/**
 * Utility function to determine if an appointment is in the past or canceled.
 * @param {string} date - The date of the appointment in 'YYYY-MM-DD' format.
 * @param {string} start - The start time of the appointment in 'HH:MM' format.
 * @param {string} status - The status of the appointment.
 * @returns {boolean} - True if the appointment is in the past or canceled, else false.
 */
const isAppointmentInPastOrCanceled = (date, start, status) => {
  const appointmentDateTime = new Date(`${date}T${start}`);
  const now = new Date();
  return appointmentDateTime < now || status === 'canceled';
};

/**
 * Utility function to generate a unique ID.
 * Replace this with a more robust solution (e.g., UUID) if necessary.
 */
const generateUniqueId = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Export the DoctorDashboard component.
 */
export default DoctorDashboard;
