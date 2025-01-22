// src/components/doctor/AbsenceForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal'; // Adjust the path accordingly
import '../../styles/absenceForm.css'; // Ensure correct path
import { firebaseLink } from '../../dataSource';

const AbsenceForm = ({
  doctorId,
  onSubmit,
  appointments,
  patients,
  existingAbsences,
  dataSource, // 'firebase' or 'api'
}) => {
  const isFirebase = dataSource === firebaseLink;

  // Initialize absences based on existing data
  const [absences, setAbsences] = useState(
    existingAbsences.map((abs) => ({
      id: abs.id || null, // Ensure each absence has an id if available
      startDate: abs.startDate,
      endDate: abs.endDate,
      reason: abs.reason,
    }))
  );

  // State to track appointments to cancel
  const [appointmentsToCancel, setAppointmentsToCancel] = useState([]);

  // State to track deleted absences
  const [deletedAbsenceIds, setDeletedAbsenceIds] = useState([]);

  // Modal State Variables
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);

  // Handle changes for Absences
  const handleChange = (index, field, value) => {
    const updatedAbsences = [...absences];
    updatedAbsences[index][field] = value;
    setAbsences(updatedAbsences);
  };

  // Add a new absence entry
  const addAbsence = () => {
    setAbsences([
      ...absences,
      { id: null, startDate: '', endDate: '', reason: '' },
    ]);
  };

  // Remove an absence entry and track deleted IDs if present
  const removeAbsence = (index) => {
    const removedAbsence = absences[index];
    setAbsences(absences.filter((_, i) => i !== index));

    // If the removed absence has an id, track it for deletion
    if (removedAbsence.id) {
      setDeletedAbsenceIds((prev) => [...prev, removedAbsence.id]);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteClick = (absence, index) => {
    setAbsenceToDelete({ absence, index });
    setShowDeleteModal(true);
  };

  // Confirm Deletion of Absence
  const confirmRemoveAbsence = () => {
    const { absence, index } = absenceToDelete;
    // Proceed with removal
    setAbsences(absences.filter((_, i) => i !== index));

    // If the removed absence has an id, track it for deletion
    if (absence.id) {
      setDeletedAbsenceIds((prev) => [...prev, absence.id]);
    }

    // Close the modal
    setShowDeleteModal(false);
    setAbsenceToDelete(null);
  };

  // Cancel Deletion
  const cancelRemoveAbsence = () => {
    setShowDeleteModal(false);
    setAbsenceToDelete(null);
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    for (let abs of absences) {
      if (!abs.startDate || !abs.endDate || !abs.reason) {
        alert('Please fill out all fields for each absence.');
        return;
      }
      if (new Date(abs.startDate) > new Date(abs.endDate)) {
        alert('Start date cannot be after end date.');
        return;
      }
    }

    // Collect all absence dates
    let absenceDates = [];
    absences.forEach((abs) => {
      const start = new Date(abs.startDate);
      const end = new Date(abs.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        absenceDates.push(d.toISOString().split('T')[0]); // 'YYYY-MM-DD'
      }
    });

    // Find conflicting appointments
    const conflictingApts = appointments.filter(
      (apt) =>
        apt.doctorId === doctorId &&
        absenceDates.includes(apt.date) &&
        apt.status === 'confirmed'
    );

    if (conflictingApts.length > 0) {
      // Show Conflict Modal
      setConflictingAppointments(conflictingApts);
      setShowConflictModal(true);
    } else {
      // No conflicts; proceed to add absences
      await onSubmit(absences, deletedAbsenceIds, []);
      // Reset form after submission
      setAbsences([{ id: null, startDate: '', endDate: '', reason: '' }]);
      setDeletedAbsenceIds([]);
      alert('Absences have been successfully updated.');
    }
  };

  // Handle User Confirmation to Cancel Appointments and Proceed
  const handleConfirmCancel = async () => {
    await onSubmit(absences, deletedAbsenceIds, conflictingAppointments);
    // Reset form after submission
    setAbsences([{ id: null, startDate: '', endDate: '', reason: '' }]);
    setDeletedAbsenceIds([]);
    setAppointmentsToCancel([]);
    setConflictingAppointments([]);
    setShowConflictModal(false);
    alert('Absences and conflicting appointments have been successfully updated.');
  };

  // Handle User Cancellation of Conflict Resolution
  const handleCancelConflict = () => {
    setConflictingAppointments([]);
    setShowConflictModal(false);
    // Optionally, allow the user to modify the absences before resubmitting
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="absence-form">
        <h3>Manage Absences</h3>
        {absences.map((abs, index) => (
          <div key={index} className="absence-entry">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={abs.startDate}
                onChange={(e) => handleChange(index, 'startDate', e.target.value)}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={abs.endDate}
                onChange={(e) => handleChange(index, 'endDate', e.target.value)}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Reason:</label>
              <input
                type="text"
                value={abs.reason}
                onChange={(e) => handleChange(index, 'reason', e.target.value)}
                required
                placeholder="Reason for absence"
                className="form-control"
              />
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleDeleteClick(abs, index)}
              disabled={absences.length === 1}
            >
              Remove
            </button>
            <hr />
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addAbsence}>
          Add Another Absence
        </button>
        <br />
        <button type="submit" className="btn btn-primary mt-3">
          Save Absences
        </button>
      </form>

      {/* Conflict Modal */}
      <Modal isOpen={showConflictModal} onClose={handleCancelConflict}>
        <h2>Conflicting Appointments</h2>
        <p>The following appointments conflict with your declared absences:</p>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {conflictingAppointments.map((app) => {
              const patient = patients.find((pat) => pat._id === app.patientId);
              return (
                <tr key={app._id}>
                  <td>{app.date}</td>
                  <td>
                    {app.start} - {app.end}
                  </td>
                  <td>{patient ? patient.name : 'Unknown'}</td>
                  <td>{app.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p>Do you want to cancel these appointments and proceed with declaring your absences?</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-secondary mr-2" onClick={handleCancelConflict}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleConfirmCancel}>
            Add Absence
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={cancelRemoveAbsence}>
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this absence entry?</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-secondary mr-2" onClick={cancelRemoveAbsence}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmRemoveAbsence}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

AbsenceForm.propTypes = {
  doctorId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired, // Function to handle form submission
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      doctorId: PropTypes.string.isRequired,
      patientId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      start: PropTypes.string.isRequired,
      end: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.string.isRequired,
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
      // Add other relevant fields
    })
  ).isRequired,
  existingAbsences: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string, // Optional for Firebase
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
      reason: PropTypes.string.isRequired,
    })
  ),
  dataSource: PropTypes.string.isRequired, // 'firebase' or 'api'
};

AbsenceForm.defaultProps = {
  existingAbsences: [],
};

export default AbsenceForm;
