// components/doctor/AvailabilityForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal'; // Ensure correct path
import '../../styles/availabilityForm.css'; // Ensure correct path

const AvailabilityForm = ({ onSubmit, specialties, existingAvailability }) => {
  // State to track selected availability type
  const [availabilityType, setAvailabilityType] = useState('recurring'); // 'recurring' or 'one-time'

  // Recurring Availabilities State
  const [recurringAvailabilities, setRecurringAvailabilities] = useState([
    { id: null, day: '', startDate: '', endDate: '', timeRanges: [{ start: '', end: '' }] }
  ]);

  // One-Time Availabilities State
  const [oneTimeAvailabilities, setOneTimeAvailabilities] = useState([
    { id: null, date: '', timeRanges: [{ start: '', end: '' }] }
  ]);

  // State to track deletions
  const [deletedRecurringIds, setDeletedRecurringIds] = useState([]);
  const [deletedOneTimeIds, setDeletedOneTimeIds] = useState([]);
  
  // Modal State for Recurring Deletion Confirmation
  const [recurringToDelete, setRecurringToDelete] = useState(null);
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);

  // Modal State for One-Time Deletion Confirmation
  const [oneTimeToDelete, setOneTimeToDelete] = useState(null);
  const [showOneTimeDeleteModal, setShowOneTimeDeleteModal] = useState(false);

  // Modal State for Collision Warning
  const [showCollisionWarningModal, setShowCollisionWarningModal] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState('');

  // Effect to initialize form with existing availability data
  useEffect(() => {
    if (existingAvailability) {
      if (existingAvailability.recurring && existingAvailability.recurring.length > 0) {
        setRecurringAvailabilities(existingAvailability.recurring.map(rec => ({
          id: rec.id, // Ensure each availability has an id
          day: rec.day,
          startDate: rec.startDate || '', // Assuming existingAvailability includes startDate and endDate
          endDate: rec.endDate || '',
          timeRanges: rec.timeRanges.map(tr => ({ start: tr.start, end: tr.end }))
        })));
        setAvailabilityType('recurring');
      }

      if (existingAvailability.one_time_availabilities && existingAvailability.one_time_availabilities.length > 0) {
        setOneTimeAvailabilities(existingAvailability.one_time_availabilities.map(ot => ({
          id: ot.id, // Ensure each availability has an id
          date: ot.date,
          timeRanges: ot.timeRanges.map(tr => ({ start: tr.start, end: tr.end }))
        })));
        setAvailabilityType('one-time');
      }
    }
  }, [existingAvailability]);

  // Handle changes for Availability Type
  const handleAvailabilityTypeChange = (e) => {
    setAvailabilityType(e.target.value);
  };

  // -------------------
  // Recurring Availabilities Handlers
  // -------------------

  const handleRecurringDayChange = (index, value) => {
    const newRecurring = [...recurringAvailabilities];
    newRecurring[index].day = value;
    setRecurringAvailabilities(newRecurring);
  };

  const handleRecurringStartDateChange = (index, value) => {
    const newRecurring = [...recurringAvailabilities];
    newRecurring[index].startDate = value;
    setRecurringAvailabilities(newRecurring);
  };

  const handleRecurringEndDateChange = (index, value) => {
    const newRecurring = [...recurringAvailabilities];
    newRecurring[index].endDate = value;
    setRecurringAvailabilities(newRecurring);
  };

  const handleRecurringTimeChange = (index, timeRangeIndex, field, value) => {
    const newRecurring = [...recurringAvailabilities];
    newRecurring[index].timeRanges[timeRangeIndex][field] = value;
    setRecurringAvailabilities(newRecurring);
  };

  const addRecurringTimeRange = (index) => {
    const newRecurring = [...recurringAvailabilities];
    newRecurring[index].timeRanges.push({ start: '', end: '' });
    setRecurringAvailabilities(newRecurring);
  };

  const removeRecurringTimeRange = (index, timeRangeIndex) => {
    const newRecurring = [...recurringAvailabilities];
    if (newRecurring[index].timeRanges.length > 1) { // Ensure at least one time range remains
      newRecurring[index].timeRanges.splice(timeRangeIndex, 1);
      setRecurringAvailabilities(newRecurring);
    }
  };

  const addRecurringAvailability = () => {
    setRecurringAvailabilities([...recurringAvailabilities, { id: null, day: '', startDate: '', endDate: '', timeRanges: [{ start: '', end: '' }] }]);
  };

  const prepareRemoveRecurringAvailability = (index) => {
    const availability = recurringAvailabilities[index];
    setRecurringToDelete({ ...availability, index });
    setShowRecurringDeleteModal(true);
  };

  const confirmRemoveRecurringAvailability = () => {
    const { id, index } = recurringToDelete;

    if (id) {
      // If the availability has an id, add it to the deletedRecurringIds
      setDeletedRecurringIds([...deletedRecurringIds, id]);
    }

    // Remove the availability from the array
    const newRecurring = [...recurringAvailabilities];
    newRecurring.splice(index, 1);
    setRecurringAvailabilities(newRecurring);

    // Reset modal state
    setRecurringToDelete(null);
    setShowRecurringDeleteModal(false);
  };

  const cancelRemoveRecurringAvailability = () => {
    setRecurringToDelete(null);
    setShowRecurringDeleteModal(false);
  };

  // -------------------
  // One-Time Availabilities Handlers
  // -------------------

  const handleOneTimeDateChange = (index, value) => {
    const newOneTime = [...oneTimeAvailabilities];
    newOneTime[index].date = value;
    setOneTimeAvailabilities(newOneTime);
  };

  const handleOneTimeTimeChange = (index, timeRangeIndex, field, value) => {
    const newOneTime = [...oneTimeAvailabilities];
    newOneTime[index].timeRanges[timeRangeIndex][field] = value;
    setOneTimeAvailabilities(newOneTime);
  };

  const addOneTimeTimeRange = (index) => {
    const newOneTime = [...oneTimeAvailabilities];
    newOneTime[index].timeRanges.push({ start: '', end: '' });
    setOneTimeAvailabilities(newOneTime);
  };

  const removeOneTimeTimeRange = (index, timeRangeIndex) => {
    const newOneTime = [...oneTimeAvailabilities];
    if (newOneTime[index].timeRanges.length > 1) { // Ensure at least one time range remains
      newOneTime[index].timeRanges.splice(timeRangeIndex, 1);
      setOneTimeAvailabilities(newOneTime);
    }
  };

  const addOneTimeAvailability = () => {
    setOneTimeAvailabilities([...oneTimeAvailabilities, { id: null, date: '', timeRanges: [{ start: '', end: '' }] }]);
  };

  const prepareRemoveOneTimeAvailability = (index) => {
    const availability = oneTimeAvailabilities[index];
    setOneTimeToDelete({ ...availability, index });
    setShowOneTimeDeleteModal(true);
  };

  const confirmRemoveOneTimeAvailability = () => {
    const { id, index } = oneTimeToDelete;

    if (id) {
      // If the availability has an id, add it to the deletedOneTimeIds
      setDeletedOneTimeIds([...deletedOneTimeIds, id]);
    }

    // Remove the availability from the array
    const newOneTime = [...oneTimeAvailabilities];
    newOneTime.splice(index, 1);
    setOneTimeAvailabilities(newOneTime);

    // Reset modal state
    setOneTimeToDelete(null);
    setShowOneTimeDeleteModal(false);
  };

  const cancelRemoveOneTimeAvailability = () => {
    setOneTimeToDelete(null);
    setShowOneTimeDeleteModal(false);
  };

  // -------------------
  // Collision Detection Logic
  // -------------------

  const checkForCollisions = () => {
    // Only check for recurring availabilities
    const newRecurringAvailabilities = recurringAvailabilities.filter(rec => !rec.id || !deletedRecurringIds.includes(rec.id));

    for (let i = 0; i < newRecurringAvailabilities.length; i++) {
      for (let j = i + 1; j < newRecurringAvailabilities.length; j++) {
        const a = newRecurringAvailabilities[i];
        const b = newRecurringAvailabilities[j];

        if (a.startDate && a.endDate && b.startDate && b.endDate) {
          // Check if a and b date ranges overlap
          const aStart = new Date(a.startDate);
          const aEnd = new Date(a.endDate);
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);

          if (a.day === b.day && aStart <= bEnd && bStart <= aEnd) {
            return `Recurring availability on "${a.day}" from ${a.startDate} to ${a.endDate} overlaps with "${b.day}" from ${b.startDate} to ${b.endDate}.`;
          }
        }
      }
    }

    return null;
  };

  // -------------------
  // Form Submission Handler
  // -------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate Recurring Availabilities
    if (availabilityType === 'recurring') {
      for (let rec of recurringAvailabilities) {
        if (!rec.day) {
          alert('Please select a day for all recurring availabilities.');
          return;
        }
        if (!rec.startDate || !rec.endDate) {
          alert('Please define start and end dates for all recurring availabilities.');
          return;
        }
        const start = new Date(rec.startDate);
        const end = new Date(rec.endDate);
        if (start > end) {
          alert('Start date must be before end date in recurring availabilities.');
          return;
        }
        for (let tr of rec.timeRanges) {
          if (!tr.start || !tr.end) {
            alert('Please fill out all recurring time ranges.');
            return;
          }
          if (tr.start >= tr.end) {
            alert('In recurring availabilities, start time must be earlier than end time.');
            return;
          }
        }
      }
    }

    // Validate One-Time Availabilities
    if (availabilityType === 'one-time') {
      for (let ot of oneTimeAvailabilities) {
        if (!ot.date) {
          alert('Please select a date for all one-time availabilities.');
          return;
        }
        for (let tr of ot.timeRanges) {
          if (!tr.start || !tr.end) {
            alert('Please fill out all one-time time ranges.');
            return;
          }
          if (tr.start >= tr.end) {
            alert('In one-time availabilities, start time must be earlier than end time.');
            return;
          }
        }
      }
    }

    // Check for collisions
    const collision = checkForCollisions();
    if (collision) {
      setCollisionMessage(collision);
      setShowCollisionWarningModal(true);
      return;
    }

    // Construct Availability Object
    let availability = {};
    if (availabilityType === 'recurring') {
      availability.recurring = recurringAvailabilities.map(rec => ({
        // id: rec.id, // Include id if existing
        day: rec.day,
        startDate: rec.startDate,
        endDate: rec.endDate,
        timeRanges: rec.timeRanges.map(tr => ({
          start: tr.start,
          end: tr.end
        }))
      }));
    } else if (availabilityType === 'one-time') {
      availability.one_time_availabilities = oneTimeAvailabilities.map(ot => ({
        // id: ot.id, // Include id if existing
        date: ot.date,
        timeRanges: ot.timeRanges.map(tr => ({
          start: tr.start,
          end: tr.end
        }))
      }));
    }

    // Submit the availability and deletions
    onSubmit(availability, deletedRecurringIds, deletedOneTimeIds);

    // Optional: Reset form after submission
    // setRecurringAvailabilities([{ id: null, day: '', startDate: '', endDate: '', timeRanges: [{ start: '', end: '' }] }]);
    // setOneTimeAvailabilities([{ id: null, date: '', timeRanges: [{ start: '', end: '' }] }]);
    // setDeletedRecurringIds([]);
    // setDeletedOneTimeIds([]);
    // setAvailabilityType('recurring');
    // alert('Availability has been successfully updated.');
  };

  // -------------------
  // Collision Warning Modal Handlers
  // -------------------

  const closeCollisionWarningModal = () => {
    setShowCollisionWarningModal(false);
    setCollisionMessage('');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="availability-form">
        <h2>Define Availability</h2>

        {/* Availability Type Selection */}
        <div className="availability-type mb-3">
          <label className="mr-3">
            <input
              type="radio"
              value="recurring"
              checked={availabilityType === 'recurring'}
              onChange={handleAvailabilityTypeChange}
            />
            Recurring Availability
          </label>
          <label>
            <input
              type="radio"
              value="one-time"
              checked={availabilityType === 'one-time'}
              onChange={handleAvailabilityTypeChange}
            />
            One-Time Availability
          </label>
        </div>

        {/* Recurring Availabilities */}
        {availabilityType === 'recurring' && (
          <div className="availability-section mb-4">
            <h3>Recurring Availabilities</h3>
            {recurringAvailabilities.map((rec, index) => (
              <div key={index} className="recurring-availability mb-3 p-3 border rounded">
                <div className="form-row mb-2">
                  <label className="mr-2">
                    Day:
                    <select
                      value={rec.day}
                      onChange={(e) => handleRecurringDayChange(index, e.target.value)}
                      required
                      className="ml-2 form-control"
                    >
                      <option value="">-- Select Day --</option>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {recurringAvailabilities.length > 1 && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => prepareRemoveRecurringAvailability(index)}
                      title="Delete Recurring Availability"
                      aria-label="Delete Recurring Availability"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Start and End Dates */}
                <div className="form-row mb-2">
                  <label className="mr-2">
                    Start Date:
                    <input
                      type="date"
                      value={rec.startDate}
                      onChange={(e) => handleRecurringStartDateChange(index, e.target.value)}
                      required
                      className="ml-2 form-control"
                    />
                  </label>
                  <label className="mr-2">
                    End Date:
                    <input
                      type="date"
                      value={rec.endDate}
                      onChange={(e) => handleRecurringEndDateChange(index, e.target.value)}
                      required
                      className="ml-2 form-control"
                    />
                  </label>
                </div>

                {/* Time Ranges */}
                <div className="time-ranges mb-2">
                  <label><strong>Time Ranges:</strong></label>
                  {rec.timeRanges.map((tr, trIndex) => (
                    <div key={trIndex} className="time-range form-row align-items-center mb-2">
                      <button
                        type="button"
                        className="delete-time-range-button"
                        onClick={() => removeRecurringTimeRange(index, trIndex)}
                        title="Delete Time Range"
                        aria-label="Delete Time Range"
                      >
                        &times;
                      </button>
                      <input
                        type="time"
                        value={tr.start}
                        onChange={(e) => handleRecurringTimeChange(index, trIndex, 'start', e.target.value)}
                        required
                        className="form-control mr-2"
                      />
                      <span className="mr-2">to</span>
                      <input
                        type="time"
                        value={tr.end}
                        onChange={(e) => handleRecurringTimeChange(index, trIndex, 'end', e.target.value)}
                        required
                        className="form-control mr-2"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => addRecurringTimeRange(index)} className="btn btn-secondary btn-sm">
                    Add Time Range
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addRecurringAvailability} className="btn btn-secondary btn-sm">
              Add Recurring Availability
            </button>
          </div>
        )}

        {/* One-Time Availabilities */}
        {availabilityType === 'one-time' && (
          <div className="availability-section mb-4">
            <h3>One-Time Availabilities</h3>
            {oneTimeAvailabilities.map((ot, index) => (
              <div key={index} className="one-time-availability mb-3 p-3 border rounded">
                <div className="form-row mb-2">
                  <label className="mr-2">
                    Date:
                    <input
                      type="date"
                      value={ot.date}
                      onChange={(e) => handleOneTimeDateChange(index, e.target.value)}
                      required
                      className="ml-2 form-control"
                    />
                  </label>
                  {oneTimeAvailabilities.length > 1 && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => prepareRemoveOneTimeAvailability(index)}
                      title="Delete One-Time Availability"
                      aria-label="Delete One-Time Availability"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Time Ranges */}
                <div className="time-ranges mb-2">
                  <label><strong>Time Ranges:</strong></label>
                  {ot.timeRanges.map((tr, trIndex) => (
                    <div key={trIndex} className="time-range form-row align-items-center mb-2">
                      <button
                        type="button"
                        className="delete-time-range-button"
                        onClick={() => removeOneTimeTimeRange(index, trIndex)}
                        title="Delete Time Range"
                        aria-label="Delete Time Range"
                      >
                        &times;
                      </button>
                      <input
                        type="time"
                        value={tr.start}
                        onChange={(e) => handleOneTimeTimeChange(index, trIndex, 'start', e.target.value)}
                        required
                        className="form-control mr-2"
                      />
                      <span className="mr-2">to</span>
                      <input
                        type="time"
                        value={tr.end}
                        onChange={(e) => handleOneTimeTimeChange(index, trIndex, 'end', e.target.value)}
                        required
                        className="form-control mr-2"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => addOneTimeTimeRange(index)} className="btn btn-secondary btn-sm">
                    Add Time Range
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addOneTimeAvailability} className="btn btn-secondary btn-sm">
              Add One-Time Availability
            </button>
          </div>
        )}

        <hr />

        <button type="submit" className="submit-button btn btn-primary">
          Save Availability
        </button>
      </form>

      {/* Recurring Deletion Confirmation Modal */}
      <Modal isOpen={showRecurringDeleteModal} onClose={cancelRemoveRecurringAvailability}>
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this recurring availability?</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-secondary mr-2" onClick={cancelRemoveRecurringAvailability}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmRemoveRecurringAvailability}>
            Delete
          </button>
        </div>
      </Modal>

      {/* One-Time Deletion Confirmation Modal */}
      <Modal isOpen={showOneTimeDeleteModal} onClose={cancelRemoveOneTimeAvailability}>
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this one-time availability?</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-secondary mr-2" onClick={cancelRemoveOneTimeAvailability}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmRemoveOneTimeAvailability}>
            Delete
          </button>
        </div>
      </Modal>

      {/* Collision Warning Modal */}
      <Modal isOpen={showCollisionWarningModal} onClose={closeCollisionWarningModal} className="warning-modal">
        <h2>Collision Detected</h2>
        <p>{collisionMessage}</p>
        <div className="modal-buttons mt-3">
          <button className="btn btn-primary" onClick={closeCollisionWarningModal}>
            OK
          </button>
        </div>
      </Modal>
    </>
    )};

    AvailabilityForm.propTypes = {
      onSubmit: PropTypes.func.isRequired,         
      specialties: PropTypes.arrayOf(PropTypes.object).isRequired, 
      existingAvailability: PropTypes.shape({
        recurring: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number, // Ensure id is provided
            day: PropTypes.string.isRequired,
            startDate: PropTypes.string.isRequired,
            endDate: PropTypes.string.isRequired,
            timeRanges: PropTypes.arrayOf(
              PropTypes.shape({
                start: PropTypes.string.isRequired,
                end: PropTypes.string.isRequired,
              })
            ).isRequired,
          })
        ),
        one_time_availabilities: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number, // Ensure id is provided
            date: PropTypes.string.isRequired,
            timeRanges: PropTypes.arrayOf(
              PropTypes.shape({
                start: PropTypes.string.isRequired,
                end: PropTypes.string.isRequired,
              })
            ).isRequired,
          })
        ),
      }),
    };

    AvailabilityForm.defaultProps = {
      existingAvailability: null,
    };

    export default AvailabilityForm;
