// components/calendar/Calendar.js
import React, { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import { startOfWeek, addDays, formatDate } from '../../utils/dateUtils';
import '../../styles/calendar.css'; // Ensure correct path
import PropTypes from 'prop-types';

const Calendar = ({
  selectedDoctors, // Array of doctor objects
  selectedPatient,
  appointments,
  onSlotClick,
  visitDuration,
  dashboardType,
  specialties, // 'doctor' or 'patient'
  patients,
  doctors
}) => {
  // Initialize currentWeekStart to the start of the current week (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));

  // Generate an array of dates for the current week (Monday to Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Handlers for navigating weeks
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  return (
    <div className="calendar-container">
      {/* Navigation Buttons */}
      <div className="calendar-nav">
        <button onClick={handlePrevWeek} className="nav-button">
          &lt; Previous Week
        </button>
        <h2 className="current-week">
          {formatDate(currentWeekStart, 'MMM dd, yyyy')} - {formatDate(addDays(currentWeekStart, 6), 'MMM dd, yyyy')}
        </h2>
        <button onClick={handleNextWeek} className="nav-button">
          Next Week &gt;
        </button>
      </div>

      {/* Calendar Header */}
      <CalendarHeader weekDays={weekDays} appointments={appointments} selectedDoctors={selectedDoctors} />

      {/* Calendar Grid */}
      <CalendarGrid
        weekDays={weekDays}
        selectedDoctors={selectedDoctors}
        selectedPatient={selectedPatient}
        appointments={appointments}
        onSlotClick={onSlotClick}
        visitDuration={visitDuration}
        dashboardType={dashboardType}
        specialties={specialties}
        patients={patients}
        doctors={doctors}
      />
    </div>
  );
};

Calendar.propTypes = {
  selectedDoctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  appointments: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSlotClick: PropTypes.func.isRequired,
  visitDuration: PropTypes.number.isRequired,
  dashboardType: PropTypes.oneOf(['doctor', 'patient']).isRequired,
};

export default Calendar;
