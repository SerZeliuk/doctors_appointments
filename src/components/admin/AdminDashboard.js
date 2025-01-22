// src/components/admin/AdminDashboard.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { auth } from '../../firebase/config'; // Ensure correct import
import { setData } from '../../firebase/firebaseUtils';
import { createUserWithEmailAndPassword} from 'firebase/auth';
import PersistenceSelector from './PersistenceSelector';
import { redirect } from 'react-router-dom';

const AdminDashboard = ({ doctors, setDoctors, dataSource, addDoctor }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !name || !specialty) {
      return setError('All fields are required.');
    }

    setLoading(true);
    try {
      // Create new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password).then((cred) => cred).catch((err) => { throw err; });
      const doctorId = userCredential.user.uid;

      // Set doctor details in the database
      const newDoctor = {
        name,
        specialty,
        availability: {
          absences: [""], // or [] if you plan to store an array of absences
          recurring: [""], // or [] for recurring availability
          one_time_availabilities: [""], // or [] for one-time availabilities
        },
        email,
        // role: 'doctor', // Uncomment if you want to include role here
      };
      await setData(`doctors/`, newDoctor);
      await setData('users/', { email, role: 'doctor' });

      // Update local state
      setDoctors([...doctors, { _id: doctorId, ...newDoctor }]);

      // Reset form fields
      setEmail('');
      setPassword('');
      setName('');
      setSpecialty('');

      alert('Doctor added successfully!');
      redirect('/');
    } catch (err) {
      console.error('Error adding doctor:', err);
      setError(`Failed to add doctor: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      
      <h2>Admin Dashboard</h2>
      
      <PersistenceSelector/>

      <h4 className="mt-4">Add New Doctor</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleAddDoctor} className="w-50">
        <div className="form-group">
          <label htmlFor="doctor-email">Doctor's Email:</label>
          <input
            type="email"
            id="doctor-email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter doctor's email"
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="doctor-password">Password:</label>
          <input
            type="password"
            id="doctor-password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="doctor-name">Doctor's Name:</label>
          <input
            type="text"
            id="doctor-name"
            className="form-control"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter doctor's name"
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="doctor-specialty">Specialty:</label>
          <input
            type="text"
            id="doctor-specialty"
            className="form-control"
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Enter doctor's specialty"
          />
        </div>
        <button disabled={loading} type="submit" className="btn btn-primary mt-4">
          Add Doctor
        </button>
      </form>
    </div>
  );
};

AdminDashboard.propTypes = {
  doctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  setDoctors: PropTypes.func.isRequired,
  dataSource: PropTypes.string.isRequired,
  addDoctor: PropTypes.func, // Not used in this implementation
};

AdminDashboard.defaultProps = {
  addDoctor: () => {},
};

export default AdminDashboard;
