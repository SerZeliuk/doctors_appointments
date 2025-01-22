// src/components/auth/Signup.js
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/auth.css';


const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');

  // For password confirmation
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await signup(email, password, name, 'patient'); // Default role is 'patient'
      navigate('/'); // Redirect to home or dashboard
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className=" authform mt-5">
      <h2>Sign Up</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="w-50">

        <div className="form-group">
          <label htmlFor="signup-email">Email:</label>
          <input
            type="email"
            id="signup-email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-name">Name:</label>
          <input
            type="name"
            id="signup-name"
            className="form-control"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-name">Age:</label>
          <input
            type="number"
            id="signup-age"
            className="form-control"
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group mt-3">
          <label htmlFor="signup-password">Password:</label>
          <input
            type="password"
            id="signup-password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        <div className="form-group mt-3">
          <label htmlFor="signup-password-confirm">Confirm Password:</label>
          <input
            type="password"
            id="signup-password-confirm"
            className="form-control"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="Confirm your password"
          />
        </div>
        <button disabled={loading} type="submit" className="btn btn-primary mt-4">
          Sign Up
        </button>
      </form>
      <div className="mt-3">
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export default Signup;
