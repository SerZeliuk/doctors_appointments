// src/components/calendar/CalendarGrid.js
import React from 'react';
import TimeSlot from './TimeSlot';
import '../../styles/calendar.css'; // Ensure correct path
import { isPast, setHours, setMinutes, format, isToday } from 'date-fns';
import PropTypes from 'prop-types';
import { getAvailabilityStatus, getPatientAvailability } from '../../utils/availabilityUtils'; // Adjust the import path accordingly

const CalendarGrid = ({
  weekDays,
  selectedDoctors, // Array of doctor objects with _id
  selectedPatient, // Patient object with _id
  appointments, // Array of appointment objects
  onSlotClick,
  dashboardType, // 'doctor' or 'patient'
  specialties, // Array of specialty objects
  patients, // Array of patient objects
  doctors, // Array of doctor objects
}) => {
  const startHour = 6; // 6 AM
  const displayHours = 18; // Display from 6 AM to 12 AM (midnight)
  const slotInterval = 30; // 30 minutes per slot
  const slots = generateTimeSlots(startHour, displayHours, slotInterval); // e.g., 6:00, 6:30, ..., 23:30

  return (
    <div className="calendar-grid">
      {/* Time Labels */}
      <div className="time-column">
        {slots.map((slot, i) => (
          <div key={i} className="time-label">
            {slot}
          </div>
        ))}
      </div>

      {/* Days Columns */}
      {weekDays.map((day, dayIndex) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const highlight = isToday(day) ? 'today-column' : '';

        return (
          <div key={dayIndex} className={`day-column ${highlight}`}>
            {slots.map((slot, i) => {
              // Early exit if slot is undefined or invalid
              if (!slot || typeof slot !== 'string') {
                console.error(`Invalid slot value: ${slot} on ${dateStr}`);
                return null;
              }

              const slotPast = isPast(
                setHours(
                  setMinutes(new Date(day), parseInt(slot.split(':')[1], 10)),
                  parseInt(slot.split(':')[0], 10)
                )
              );

              let isAvailable = false;
              let isOneTimeAvailable = false;
              let isAbsent = false;
              let slotAppointments = [];

              // Iterate through selected doctors to determine availability
              selectedDoctors.forEach((doctor) => {
                const availabilityStatus = getAvailabilityStatus(doctor, dateStr, slot, appointments);
                if (availabilityStatus.isTaken) {
                  // Slot is taken by an appointment
                  isAvailable = false; // Cannot accommodate
                } else if (availabilityStatus.isAbsent) {
                  // Doctor is absent
                  isAbsent = true;
                  isAvailable = false;
                } else if (availabilityStatus.isOneTimeAvailable) {
                  // One-time availability
                  isOneTimeAvailable = true;
                  isAvailable = true;
                } else if (availabilityStatus.isRecurringAvailable) {
                  // Recurring availability
                  isAvailable = true;
                }
              });

              // Determine patient-specific appointments
              const patientAppointments = getPatientAvailability(selectedPatient, dateStr, slot, appointments);
              const hasPatientAppointment = patientAppointments.length > 0;

              // For doctor dashboard, gather appointments for the specific doctor
              if (selectedDoctors.length === 1) {
                const doctorId = selectedDoctors[0]._id; // Use _id instead of id
                slotAppointments = appointments.filter((apt) => {
                  return (
                    apt.doctorId === doctorId &&
                    apt.date === dateStr &&
                    apt.start <= slot &&
                    apt.end > slot &&
                    (apt.status === 'confirmed' || apt.status === 'in-progress')
                  );
                });
              }

              // Determine if the slot can accommodate any booking
              let canAccommodate = isAvailable && !slotPast && !hasPatientAppointment;

              return (
                <TimeSlot
                  key={`${dayIndex}-${i}`}
                  date={dateStr}
                  time={slot}
                  availableDoctors={selectedDoctors}
                  patientAppointments={patientAppointments}
                  slotAppointments={slotAppointments}
                  isAvailable={canAccommodate}
                  isPast={slotPast}
                  isOneTimeAvailable={isOneTimeAvailable}
                  isAbsent={isAbsent}
                  onClick={(canAccommodate || hasPatientAppointment) ? () => onSlotClick(dateStr, slot) : null}
                  dashboardType={dashboardType}
                  specialties={specialties}
                  patients={patients}
                  doctors={doctors}
                />
              );
            })}

            {/* Current Time Indicator */}
            {isToday(day) && (
              <div
                className="current-time-indicator"
                style={{ top: getCurrentTimeIndicatorPosition(startHour) }}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

CalendarGrid.propTypes = {
  weekDays: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
  selectedDoctors: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    specialty: PropTypes.string.isRequired,
    // Add other relevant fields
  })).isRequired,
  selectedPatient: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    // Add other relevant fields
  }),
  appointments: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    doctorId: PropTypes.string.isRequired, // Should be _id of doctor
    patientId: PropTypes.string.isRequired, // Should be _id of patient
    date: PropTypes.string.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['confirmed', 'in-progress', 'canceled']).isRequired,
    // Add other relevant fields
  })).isRequired,
  onSlotClick: PropTypes.func.isRequired,
  dashboardType: PropTypes.oneOf(['doctor', 'patient']).isRequired,
  specialties: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    // Add other relevant fields
  })).isRequired,
  patients: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    gender: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    appointments: PropTypes.arrayOf(PropTypes.string), // Array of appointment _ids
    // Add other relevant fields
  })).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    specialty: PropTypes.string.isRequired,
    availability: PropTypes.array, // Define according to your schema
    // Add other relevant fields
  })).isRequired,
};

// Helper functions

/**
 * Calculate the position of the current time indicator based on the current time.
 * @param {number} startHour - The starting hour of the calendar grid.
 * @returns {string} - The CSS 'top' position in pixels.
 */
function getCurrentTimeIndicatorPosition(startHour) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const slotHeight = 40; // Example: 40px per slot
  const slotInterval = 30; // 30 minutes

  const totalSlotsFromStart = ((currentHour - startHour) * 60 + currentMin) / slotInterval;
  return `${totalSlotsFromStart * (slotHeight + 1.7) - 5}px`;
}

/**
 * Generate time slots based on start hour, number of hours, and interval.
 * @param {number} startHour - The hour to start generating slots from (24-hour format).
 * @param {number} numHours - The number of hours to generate slots for.
 * @param {number} interval - The interval between slots in minutes.
 * @returns {Array<string>} - An array of time strings in 'HH:MM' format.
 */
function generateTimeSlots(startHour, numHours, interval) {
  const slots = [];
  for (let h = startHour; h < startHour + numHours; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hourStr = h.toString().padStart(2, '0');
      const minuteStr = m.toString().padStart(2, '0');
      slots.push(`${hourStr}:${minuteStr}`);
    }
  }
  return slots;
}

CalendarGrid.defaultProps = {
  selectedPatient: null, // Default to null if not provided
};

export default CalendarGrid;
