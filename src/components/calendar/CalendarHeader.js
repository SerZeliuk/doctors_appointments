// components/calendar/CalendarHeader.js
import React from 'react';
import { format, isToday } from 'date-fns';
import PropTypes from 'prop-types'; // Optional: For prop type validation

const CalendarHeader = ({ weekDays, appointments, selectedDoctors }) => {
  const validAppointments = Array.isArray(appointments) ? appointments : [];

  // Prepare appointment counts by day and doctor
  const appointmentsByDay = weekDays.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const counts = {};
    selectedDoctors.forEach((doctor) => {
      counts[doctor.id] = validAppointments.filter(
        (a) => a.date === dateStr && a.doctorId === doctor._id && a.status === 'confirmed'
      ).length;
    });
    return { date: dateStr, counts };
  });

  return (
    <div className="calendar-header">
      <div className="time-axis-header"></div>
      {weekDays.map((day) => {
        const dayName = format(day, 'EEEE');
        const dayNum = format(day, 'dd');
        const dateStr = format(day, 'yyyy-MM-dd');
        const highlight = isToday(day) ? 'today-column' : '';
        const currentDayAppointments = appointmentsByDay.find(appt => appt.date === dateStr)?.counts || {};

        return (
          <div key={dateStr} className={`day-header ${highlight}`}>
            <div>{dayName}</div>
            <div>{dayNum}</div>
            {selectedDoctors.map((doctor) => (
              <div key={doctor.id} className="appointment-count">
                {doctor.name}: {currentDayAppointments[doctor.id] || 0}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// Optional: Prop type validation
CalendarHeader.propTypes = {
  weekDays: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
  appointments: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDoctors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // Ensure 'id' is a string
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default CalendarHeader;
