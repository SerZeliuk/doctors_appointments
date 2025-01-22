// src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PatientDashboard from './components/patient/PatientDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Home from './components/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Unauthorized from './components/auth/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import './styles/calendar.css';
import './index.css';
import { firebaseLink, localLink } from './dataSource';
import axios from 'axios';
import { getData, setData, updateData, removeData } from './firebase/firebaseUtils';
import { auth } from './firebase/config';
import { DoctorsList } from './components/patient/DoctorsList';

function AppContent() {
  // Access authentication context
  const { currentUser, userRole } = useAuth();

  // State variables
  const [dataSource, setDataSource] = useState(firebaseLink); // Default to local
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch Data Function
   * Fetches doctors, patients, appointments, and specialties based on the current data source.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (dataSource === localLink) {
          // Fetch from Local API
          const [doctorsRes, patientsRes, appointmentsRes, specialtiesRes] = await Promise.all([
            fetch('http://localhost:3001/doctors'),
            fetch('http://localhost:3001/patients'),
            fetch('http://localhost:3001/appointments'),
            fetch('http://localhost:3001/specialties'),
          ]);

          // Check if all responses are OK
          if (!doctorsRes.ok || !patientsRes.ok || !appointmentsRes.ok || !specialtiesRes.ok) {
            throw new Error('One or more responses were not OK');
          }

          // Parse JSON data
          const doctorsData = await doctorsRes.json();
          const patientsData = await patientsRes.json();
          const appointmentsData = await appointmentsRes.json();
          const specialtiesData = await specialtiesRes.json();

          // Update state with fetched data
          setDoctors(doctorsData);
          setPatients(patientsData);
          setAppointments(appointmentsData);
          setSpecialties(specialtiesData);
        } else if (dataSource === firebaseLink) {
          // Fetch from Firebase
          const [doctorsData, patientsData, appointmentsData, specialtiesData] = await Promise.all([
            getData('doctors'),
            getData('patients'),
            getData('appointments'),
            getData('specialties'),
          ]);

          // Process Firebase data
          const doctorsList = doctorsData
            ? Object.entries(doctorsData).map(([id, value]) => ({ _id: id, ...value }))
            : [];
          const patientsList = patientsData
            ? Object.entries(patientsData).map(([id, value]) => ({
                _id: id,
                ...value,
                appointments: value.appointments ? Object.keys(value.appointments) : [],
              }))
            : [];
          const appointmentsList = appointmentsData
            ? Object.entries(appointmentsData).map(([id, value]) => ({ _id: id, ...value }))
            : [];
          const specialtiesList = specialtiesData
            ? Object.entries(specialtiesData).map(([id, value]) => ({ _id: id, ...value }))
            : [];

          // Update state with fetched data
          setDoctors(doctorsList);
          setPatients(patientsList);
          setAppointments(appointmentsList);
          setSpecialties(specialtiesList);
          console.log('Fetched data from Firebase:', doctorsList, patientsList, appointmentsList, specialtiesList);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [dataSource]); // Re-fetch data when dataSource changes

  /**
   * Handle Data Source Change
   * Switches between local API and Firebase as the data source.
   */
  const handleDataSourceChange = (source) => {
    if (source !== localLink && source !== firebaseLink) {
      console.warn('Invalid data source selected.');
      return;
    }
    setDataSource(source);
  };

  /**
   * Check if a time slot is available for a doctor.
   * Ensures no overlapping appointments.
   */
  const isTimeSlotAvailable = (date, start, end, doctorId, appointmentId = null) => {
    // Convert time strings to minutes for easy comparison
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(start);
    const newEnd = timeToMinutes(end);

    const appointmentsArray = dataSource === localLink ? appointments : appointments;

    return appointmentsArray.every((apt) => {
      // If updating, exclude the current appointment from the check
      if (appointmentId && apt._id === appointmentId) return true;

      // Check for the same doctor and date
      if (apt.doctorId !== doctorId || apt.date !== date) return true;

      const aptStart = timeToMinutes(apt.start);
      const aptEnd = timeToMinutes(apt.end);

      // Check for overlap
      return newEnd <= aptStart || newStart >= aptEnd;
    });
  };

  /**
   * Add a new appointment
   */
  const addAppointment = async (bookingDetails) => {
    if (dataSource === localLink) {
      // Local Backend Logic
      try {
        const { date, start, end, doctorId, patientName } = bookingDetails;

        // Collision Detection
        const isAvailable = isTimeSlotAvailable(date, start, end, doctorId);
        if (!isAvailable) {
          alert('The selected time slot overlaps with an existing appointment for the chosen doctor.');
          return;
        }

        // Normalize the input name
        const normalizedName = patientName.trim().toLowerCase();
        let existingPatient = patients.find(
          (p) => p.name.trim().toLowerCase() === normalizedName
        );

        // If patient doesn't exist, create one first.
        if (!existingPatient) {
          const newPatient = {
            name: patientName,
            gender: bookingDetails.gender,
            age: bookingDetails.age,
            appointments: [],
          };
          const patientRes = await axios.post(`${dataSource}/patients`, newPatient);
          existingPatient = patientRes.data; // Backend returns the new patient with `_id`
          setPatients((prev) => [...prev, existingPatient]);
        }

        const patientId = existingPatient._id;

        // Create the new appointment
        const newAppointment = {
          doctorId,
          patientId,
          date,
          start,
          end,
          type: bookingDetails.type,
          description: bookingDetails.description,
          status: bookingDetails.status || 'confirmed',
        };

        const appointmentRes = await axios.post(`${dataSource}/appointments`, newAppointment);
        const addedAppointment = appointmentRes.data; // Backend returns the new appointment with `_id`

        // Update the patient's appointments array
        const updatedPatient = {
          ...existingPatient,
          appointments: [
            ...(existingPatient.appointments || []),
            addedAppointment._id,
          ],
        };

        // Update patient in Backend
        await axios.patch(`${dataSource}/patients/${existingPatient._id}`, { appointments: updatedPatient.appointments });

        // Update local state
        setAppointments((prev) => [...prev, addedAppointment]);
        setPatients((prev) =>
          prev.map((p) => (p._id === existingPatient._id ? updatedPatient : p))
        );

        alert('Appointment booked successfully!');
        return addedAppointment;
      } catch (err) {
        console.error('Error adding appointment:', err);
        alert(`Error booking appointment: ${err.message}`);
        throw err;
      }
    } else if (dataSource === firebaseLink) {
      // Firebase Realtime Database Logic
      try {
        const { date, start, end, doctorId, patientName, email, password } = bookingDetails;
        console.log(bookingDetails, "bookingDetails");
        // Collision Detection
        const isAvailable = isTimeSlotAvailable(date, start, end, doctorId);
        if (!isAvailable) {
          alert('The selected time slot overlaps with an existing appointment for the chosen doctor.');
          return;
        }

        // Normalize the input name
        const normalizedName = patientName.trim().toLowerCase();
        console.log(normalizedName, "normalizedName");
       
        // Check for existing patient
        let existingPatient = patients.find(
          (p) => p.name?.trim().toLowerCase() === normalizedName
        );

        console.log(existingPatient, "existingPatient");
        if (!existingPatient) {
          // Create new patient
          const newPatient = {
            name: patientName.trim(),
            gender: bookingDetails.gender,
            age: bookingDetails.age,
            role: 'patient',
            appointments: {},
          };
          console.log(newPatient, "newPatient");
          // Create user with email and password
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const patientId = userCredential.user.uid;

          // Save patient data in Firebase
          await setData(`patients/${patientId}`, newPatient);
          existingPatient = { ...newPatient, _id: patientId };
          setPatients((prev) => [...prev, existingPatient]);
        }

        const patientId = existingPatient._id;

        // Create the new appointment
        const newAppointment = {
          doctorId,
          patientId,
          date,
          start,
          end,
          type: bookingDetails.type,
          description: bookingDetails.description,
          status: bookingDetails.status || 'confirmed',
          createdAt: new Date().toISOString(),
        };

        const appointmentId = await setData(`appointments`, newAppointment);
        const addedAppointment = { ...newAppointment, _id: appointmentId };
        console.log('Added appointment:', addedAppointment);
        // Update the patient's appointments object
        const patientAppointmentsPath = `patients/${patientId}/appointments/`;
        await setData(patientAppointmentsPath, appointmentId); // Using 'true' as a placeholder

        // Update local state
        setAppointments((prev) => [...prev, addedAppointment]);
        const updatedPatient = {
          ...existingPatient,
          appointments: {
            ...existingPatient.appointments,
            [appointmentId]: true,
          },
        };
        setPatients((prev) =>
          prev.map((p) => (p._id === existingPatient._id ? updatedPatient : p))
        );

        alert('Appointment booked successfully via Firebase!');
        return addedAppointment;
      } catch (err) {
        console.error('Error adding appointment to Firebase:', err);
        alert(`Error booking appointment: ${err.message}`);
        throw err;
      }
    };}

    /**
     * Add a new doctor
     */
    const addDoctor = async (newDoctor) => {
      if (dataSource === firebaseLink) {
        try {
          const { name, email, password, role } = newDoctor;
          const doctor = {
            name,
            email,
            role,
            appointments: {},
          };
          // Create user with email and password
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const doctorId = userCredential.user.uid;
          // Save doctor data in Firebase
          await setData(`doctors/${doctorId}`, doctor);
          setDoctors((prev) => [...prev, { ...doctor, _id: doctorId }]);
          alert('Doctor added successfully via Firebase!');
        } catch (err) {
          console.error('Error adding doctor to Firebase:', err);
          alert(`Error adding doctor: ${err.message}`);
        }
      }
      // Add logic for local backend if needed
      else {
        try {
          const doctorRes = await axios.post(`${dataSource}/doctors`, newDoctor);
          const addedDoctor = doctorRes.data;
          setDoctors((prev) => [...prev, addedDoctor]);
          alert('Doctor added successfully!');
        } catch (err) {
          console.error('Error adding doctor:', err);
          alert(`Error adding doctor: ${err.message}`);
        }
      }
    };

    /**
     * Update an existing appointment by `_id`.
     */
    const updateAppointment = async (updatedDetails) => {
      if (dataSource === localLink) {
        // Local Backend Logic
        try {
          const { _id, date, start, end, doctorId } = updatedDetails;

          // Collision Detection (excluding the current appointment)
          const isAvailable = isTimeSlotAvailable(date, start, end, doctorId, _id);
          if (!isAvailable) {
            alert('The selected time slot overlaps with an existing appointment for the chosen doctor.');
            return;
          }

          // Find the existing appointment
          const existingAppointment = appointments.find((apt) => apt._id === _id);
          if (!existingAppointment) {
            throw new Error('Appointment not found');
          }

          // Merge fields
          const merged = {
            ...existingAppointment,
            ...updatedDetails,
          };

          // Patch the backend
          const res = await axios.patch(`${dataSource}/appointments/${_id}`, merged);
          const updatedAppointment = res.data;

          // Update local state
          setAppointments((prev) =>
            prev.map((apt) => (apt._id === updatedAppointment._id ? updatedAppointment : apt))
          );

          alert('Appointment updated successfully!');
        } catch (err) {
          console.error('Error updating appointment:', err);
          alert(`Error updating appointment: ${err.message}`);
        }
      } else if (dataSource === firebaseLink) {
        // Firebase Realtime Database Logic
        try {
          const { _id, date, start, end, doctorId } = updatedDetails;

          if (!_id) {
            throw new Error('Appointment key is missing for Firebase update.');
          }

          // Collision Detection (excluding the current appointment)
          const isAvailable = isTimeSlotAvailable(date, start, end, doctorId, _id);
          if (!isAvailable) {
            alert('The selected time slot overlaps with an existing appointment for the chosen doctor.');
            return;
          }

          // Prepare the update payload (exclude _id and patientId to prevent accidental overwrites)
          const { patientId, ...updatePayload } = updatedDetails;

          // Update the appointment in Firebase
          await updateData(`appointments/${_id}`, updatePayload);

          // Update local state
          setAppointments((prev) =>
            prev.map((apt) => (apt._id === _id ? { ...apt, ...updatePayload } : apt))
          );

          alert('Appointment updated successfully via Firebase!');
        } catch (err) {
          console.error('Error updating appointment in Firebase:', err);
          alert(`Error updating appointment: ${err.message}`);
        }
      }
    };

    /**
     * Cancel an appointment (set status = 'canceled') by `_id`.
     */
    const cancelAppointment = async (aptId) => {
      if (dataSource === localLink) {
        // Local Backend Logic
        try {
          console.log('Canceling appointment:', aptId);
          const res = await axios.patch(
            `${dataSource}/appointments/${aptId}`,
            { status: 'canceled' }
          );
          const updatedApt = res.data;
          console.log('Updated appointment:', updatedApt);
          // Update local appointments
          setAppointments((prev) =>
            prev.map((apt) => (apt._id === updatedApt._id ? updatedApt : apt))
          );
          alert('Appointment canceled successfully!');
        } catch (err) {
          console.error('Error canceling appointment:', err);
          alert(`Error canceling appointment: ${err.message}`);
        }
      } else if (dataSource === firebaseLink) {
        // Firebase Realtime Database Logic
        try {
          const appointmentKey = aptId; // Firebase key
          console.log('Canceling appointment:', appointmentKey);
          await updateData(`appointments/${appointmentKey}`, { status: 'canceled' });

          // Update local state
          setAppointments((prev) =>
            prev.map((apt) =>
              apt._id === aptId ? { ...apt, status: 'canceled' } : apt
            )
          );
          alert('Appointment canceled successfully via Firebase!');
        } catch (err) {
          console.error('Error canceling appointment in Firebase:', err);
          alert(`Error canceling appointment: ${err.message}`);
        }
      }
    };

    /**
     * Delete an appointment by `_id`.
     */
    const deleteAppointment = async (aptId) => {
      // Find the patient associated with this appointment
      const patient = patients.find((p) => p.appointments.includes(aptId));
      if (!patient) {
        alert('Associated patient not found.');
        return;
      }

      if (dataSource === localLink) {
        // Local Backend Logic
        try {
          const confirmDelete = window.confirm('Are you sure you want to delete this appointment permanently?');
          if (!confirmDelete) return;

          await axios.delete(`${dataSource}/appointments/${aptId}`);
          // Remove the appointment from the patient's appointments array
          const updatedAppointments = patient.appointments.filter((id) => id !== aptId);
          await axios.patch(`${dataSource}/patients/${patient._id}`, { appointments: updatedAppointments });

          // Update local state
          setAppointments((prev) => prev.filter((apt) => apt._id !== aptId));
          setPatients((prev) =>
            prev.map((p) => (p._id === patient._id ? { ...p, appointments: updatedAppointments } : p))
          );

          alert('Appointment deleted successfully!');
        } catch (err) {
          console.error('Error deleting appointment:', err);
          alert(`Error deleting appointment: ${err.message}`);
        }
      } else if (dataSource === firebaseLink) {
        // Firebase Realtime Database Logic
        try {
          const confirmDelete = window.confirm('Are you sure you want to delete this appointment permanently?');
          if (!confirmDelete) return;

          await removeData(`appointments/${aptId}`);
          // Remove the appointment from the patient's appointments object
          const patientAppointmentsPath = `patients/${patient._id}/appointments/${aptId}`;
          await removeData(patientAppointmentsPath);

          // Update local state
          setAppointments((prev) => prev.filter((apt) => apt._id !== aptId));
          const updatedAppointments = { ...patient.appointments };
          delete updatedAppointments[aptId];
          setPatients((prev) =>
            prev.map((p) =>
              p._id === patient._id ? { ...p, appointments: updatedAppointments } : p
            )
          );

          alert('Appointment deleted successfully via Firebase!');
        } catch (err) {
          console.error('Error deleting appointment in Firebase:', err);
          alert(`Error deleting appointment: ${err.message}`);
        }
      }
    };

    /**
     * Render loading and error states
     */
    if (loading) {
      return <div className="container mt-4">Loading...</div>;
    }
    if (error) {
      return <div className="container mt-4">Error: {error}</div>;
    }

    /**
     * Render the main application
     */
    return (
      <Router>
        <Header
          dataSource={dataSource}
          handleDataSourceChange={handleDataSourceChange}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <Home
                dataSource={dataSource}
                onDataSourceChange={handleDataSourceChange}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/doctors" element={<DoctorsList 
            doctors={doctors}
          />} />

          {/* Doctor Dashboard: accessible by [doctor, admin] */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorDashboard
                  doctors={doctors}
                  patients={patients}
                  appointments={appointments}
                  specialties={specialties}
                  addAppointment={addAppointment}
                  setAppointments={setAppointments}
                  updateAppointment={updateAppointment}
                  cancelAppointment={cancelAppointment}
                  deleteAppointment={deleteAppointment}
                  dataSource={dataSource}
                />
              </ProtectedRoute>
            }
          />

          {/* Patient Dashboard: accessible by [patient, admin] */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient', 'admin']}>
                <PatientDashboard
                  doctors={doctors}
                  patients={patients}
                  appointments={appointments}
                  specialties={specialties}
                  addAppointment={addAppointment}
                  updateAppointment={updateAppointment}
                  cancelAppointment={cancelAppointment}
                  deleteAppointment={deleteAppointment}
                  setAppointments={setAppointments}
                  dataSource={dataSource}
                />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard: accessible only by [admin] */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard
                  doctors={doctors}
                  
                  setDoctors={setDoctors}
                  dataSource={dataSource}
                  addDoctor={addDoctor}
                />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  /**
   * Header component.
   * Decides which links to display based on user authentication & role.
   */
  function Header({ dataSource, handleDataSourceChange }) {
    const { currentUser, userRole, logout } = useAuth();
    if (currentUser) {
      console.log('Current user Role:', currentUser.email, userRole);
    }

    // Render different sets of links depending on user login status & role
    const renderNavLinks = () => {
      if (!currentUser) {
        // Not logged in
        return (
          <>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/doctors">Our doctors</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/signup">Sign Up</Link>
            </li>
          </>
        );
      }
      // Logged in => check roles
      if (userRole === 'admin') {
        return (
          <>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/doctor">Doctor Dashboard</Link>
            </li>
            <li>
              <Link to="/patient">Patient Dashboard</Link>
            </li>
            <li>
              <Link to="/admin">Admin Panel</Link>
            </li>
            <li>
              <button onClick={logout} className="btn btn-link">
                Logout
              </button>
            </li>
          </>
        );
      } else if (userRole === 'doctor') {
        return (
          <>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/doctor">Doctor Dashboard</Link>
            </li>
            <li>
              <button onClick={logout} className="btn btn-link">
                Logout
              </button>
            </li>
          </>
        );
      } else if (userRole === 'patient') {
        return (
          <>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/patient">Patient Dashboard</Link>
            </li>
            <li>
              <button onClick={logout} className="btn btn-link">
                Logout
              </button>
            </li>
          </>
        );
      } else {
        // If userRole is undefined or something unexpected:
        return (
          <>
            <li>
              <Link to="/">Home</Link>
            </li>
            {/* Logout as fallback */}
            <li>
              <button onClick={logout} className="btn btn-link">
                Logout
              </button>
            </li>
          </>
        );
      }
    };

    return (
      <header className="app-header">
        <nav>
          <ul className="nav-links">{renderNavLinks()}</ul>
        </nav>

        {/* Data Source Switcher (Optional) */}
        <div className="data-source-switcher mt-2">
          <button
            className={`btn mr-2 ${
              dataSource === localLink ? 'btn-success' : 'btn-outline-success'
            }`}
            onClick={() => handleDataSourceChange(localLink)}
          >
            Local API
          </button>
          <button
            className={`btn ${
              dataSource === firebaseLink ? 'btn-success' : 'btn-outline-success'
            }`}
            onClick={() => handleDataSourceChange(firebaseLink)}
          >
            Firebase
          </button>
        </div>
      </header>
    );
  }

  function App() {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    );
  }


  export default App;
