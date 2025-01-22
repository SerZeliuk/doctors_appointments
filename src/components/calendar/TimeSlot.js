// src/components/calendar/TimeSlot.js
import React from 'react';
import '../../styles/calendar.css'; // Ensure correct path
import PropTypes from 'prop-types';

  const TimeSlot = ({
  date,
  time,
  availableDoctors, // Array of available doctors
  slotAppointments, // Array of appointments in this slot
  patientAppointments,
  isAvailable,
  isPast,
  isOneTimeAvailable, // New prop
  isAbsent, // New prop
  onClick,
  onAppointmentClick,
  dashboardType, // 'doctor' or 'patient'
  specialties, // Array of specialty objects
  patients,
  doctors,
}) => {
  const handleClick = () => {
    if (!isPast && (isAvailable || patientAppointments.length > 0) && onClick) {
      onClick();
    }
  };

  // Determine CSS classes based on slot status and dashboard type
  let slotClass = 'time-slot';
  if (isPast) {
    slotClass += ' past-slot';
  }

  // Initialize variables for background color and label
  let backgroundColor = '#FFFFFF'; // Default white
  let label = '';

  if (dashboardType === 'doctor') {
    if (slotAppointments.length > 0) {
      // Appointment has highest priority
      const appointment = slotAppointments[0];
      const doctor = doctors.find((doc) => doc._id === appointment.doctorId);

      // console.log(doctor._id, "bleh");
      const patient = patients.find((pat) => pat._id === appointment.patientId);

      const specialty = specialties.find((spec) => spec.name === (doctor ? doctor.specialty : ''));

      backgroundColor = specialty ? specialty.color : '#D3D3D3'; // Default to LightGray if no specialty color
      label = appointment.status === 'confirmed' ? 'Appointment' : 'Slot in-progress';
    } else if (isPast) {
      backgroundColor = '#D3D3D3'; // Grey for past
      label = '';
    } else if (isOneTimeAvailable) {
      // One-time availability  
      backgroundColor = '#DA70D6'; // Purple for one-time availability
      label = 'One-Time Available';
    } else if (isAbsent) {
      // Absent has next priority
      backgroundColor = '#FF5C5C'; // Red for absent
      label = 'Absent';
    } else if (isAvailable) {
      backgroundColor = '#90EE90'; // Green for available
      label = 'At Work';
    }
  } else if (dashboardType === 'patient') {
    if (isPast) {
      backgroundColor = '#D3D3D3'; // Grey for past
      label = '';
    } else if (slotAppointments.length > 0) {
      // Slot is taken by an appointment
      backgroundColor = '#F3F3F3'; // Light grey for taken slots
      label = 'Taken';
    } else if (isAbsent) {
      // Doctor is absent
      backgroundColor = '#FF5C5C'; // Red for absent
      label = 'Absent';
    } else if (isOneTimeAvailable) {
      // One-time availability
      backgroundColor = '#DA70D6'; // Purple for one-time availability
      label = 'One-Time Available';
    } else if (isAvailable) {
      backgroundColor = '#90EE90'; // Green for available
      label = 'Available';
    } else {
      // Unavailable
      backgroundColor = '#F3F3F3'; // Light grey for unavailable
      label = '';
    }
  }

  // Tooltip content
  let tooltipContent = '';
  if (dashboardType === 'patient') {
    
    if (patientAppointments.length > 0) {
      label = patientAppointments[0].status === 'confirmed' ? 'Appointment' : 'Slot in-progress';

      const appointment = patientAppointments[0];
      const doctor = doctors.find((doc) => doc._id === appointment.doctorId);
      const patient = patients.find((pat) => pat._id === appointment.patientId);

      const specialty = specialties.find((spec) => spec.name === (doctor ? doctor.specialty : ''));

      backgroundColor = appointment.status === 'confirmed'
        ? (specialty ? specialty.color : '#D3D3D3') // Use specialty color or default
        : '#FF6EC7'; // Pink for 'in-progress'

      tooltipContent = `
        Time: ${appointment.start} - ${appointment.end}
        Specialty: ${specialty ? specialty.name : 'N/A'}
        Doctor: ${doctor ? doctor.name : 'Unknown'}
        
        Type: ${appointment.type}
        Description: ${appointment.description}
      `;
    }
    else if (isAvailable) {
      tooltipContent = isOneTimeAvailable
        ? 'One-Time Available for booking'
        : 'Available for booking';
    } else if (slotAppointments.length > 0) {
      tooltipContent = 'Slot is taken';
    } else if (isAbsent) {
      tooltipContent = 'Doctor is absent';
    } else if (isPast) {
      tooltipContent = 'Slot is in the past';
    } else {
      tooltipContent = 'Unavailable';
    }
  } else if (dashboardType === 'doctor') {
    if (slotAppointments.length > 0) {
      const appointment = slotAppointments[0];
      const patient = patients.find((pat) => pat._id === appointment.patientId);
      tooltipContent = `
        Time: ${appointment.start} - ${appointment.end}
        Patient: ${patient ? patient.name : 'Unknown'}
        Type: ${appointment.type}
        Description: ${appointment.description}
      `;
    } else if (isAbsent) {
      tooltipContent = 'Absent';
    } else if (isOneTimeAvailable) {
      tooltipContent = 'One-Time Available';
    } else if (isAvailable) {
      tooltipContent = 'At Work';
    } else if (isPast) {
      tooltipContent = 'Past slot';
    }
  }

  return (
    <div
      className={slotClass}
      onClick={handleClick}
      title={tooltipContent.trim()}
      style={{ backgroundColor }}
      role="button"
      aria-label={
        dashboardType === 'patient'
          ? isAvailable
            ? isOneTimeAvailable
              ? `One-Time Available slot at ${time}`
              : `Available slot at ${time}`
            : isPast
              ? `Past slot at ${time}`
              : slotAppointments.length > 0
                ? `Taken slot at ${time}`
                : isAbsent
                  ? `Absent slot at ${time}`
                  : `Unavailable slot at ${time}`
          : slotAppointments.length > 0
            ? `Appointment at ${time}`
            : isAbsent
              ? `Absent slot at ${time}`
              : isOneTimeAvailable
                ? `One-Time Available at ${time}`
                : isAvailable
                  ? `At Work at ${time}`
                  : isPast
                    ? `Past slot at ${time}`
                    : `Unavailable slot at ${time}`
      }
      tabIndex={isAvailable && dashboardType === 'patient' && !isPast ? 0 : -1}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && isAvailable && onClick) {
          handleClick();
        }
      }}
    >
      <span className="slot-label">{label}</span>
    </div>
  );
};

TimeSlot.propTypes = {
  date: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  availableDoctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  slotAppointments: PropTypes.arrayOf(PropTypes.object).isRequired,
  patientAppointments: PropTypes.arrayOf(PropTypes.object).isRequired,
  isAvailable: PropTypes.bool.isRequired,
  isPast: PropTypes.bool.isRequired,
  isOneTimeAvailable: PropTypes.bool, // New prop
  isAbsent: PropTypes.bool, // New prop
  onAppointmentClick: PropTypes.func,
  onClick: PropTypes.func,
  dashboardType: PropTypes.oneOf(['doctor', 'patient']).isRequired,
  specialties: PropTypes.arrayOf(PropTypes.object).isRequired,
  patients: PropTypes.arrayOf(PropTypes.object).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.object).isRequired,
};

TimeSlot.defaultProps = {
  onAppointmentClick: null,
  onClick: null,
  isOneTimeAvailable: false, // Default value
  isAbsent: false, // Default value
};

export default TimeSlot;
