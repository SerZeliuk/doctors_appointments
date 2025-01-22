// src/components/DoctorsList.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * DoctorsList Component
 * Renders a list of doctors with their details.
 *
 * @param {Array} doctors - Array of doctor objects.
 */
export function DoctorsList({ doctors }) {
    if (!Array.isArray(doctors)) {
        console.error('DoctorsList expects an array of doctors');
        return null; // Or render a fallback UI
    }

    if (doctors.length === 0) {
        return <div className="no-doctors">No doctors available.</div>;
    }

    return (
        <div className="doctors-list">
            {doctors.map((doctor) => (
                <div key={doctor.id || doctor._id} className="doctor-card">
                    <h3>{doctor.name}</h3>
                    <p><strong>Specialty:</strong> {doctor.specialty}</p>
                    <p><strong>Email:</strong> {doctor.email}</p>
                </div>
            ))}
        </div>
    );
}

// Define PropTypes for better type checking
DoctorsList.propTypes = {
    doctors: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string.isRequired,
            specialty: PropTypes.string.isRequired,
            email: PropTypes.string.isRequired,
        })
    ).isRequired,
};
