// src/components/Home.js
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/home.css' // Optional: For styling
import { localLink, firebaseLink } from '../dataSource';

const Home = ({ dataSource, onDataSourceChange }) => {
  const handleChange = (e) => {
    onDataSourceChange(e.target.value);
  };

  return (
    <div className="home-container">
      <h1>Welcome to the Medical Appointment Scheduling App</h1>
      <p>Select a dashboard from the navigation above to continue.</p>

      <div className="data-source-selection">
        <h2>Select Data Source</h2>
        <form onChange={handleChange}>
          <div>
            <input
              type="radio"
              id="local"
              name="dataSource"
              value={localLink}
              checked={dataSource === localLink}
              onChange={() => {}}
            />
            <label htmlFor="local">Local Backend</label>
          </div>
          <div>
            <input
              type="radio"
              id="firebase"
              name="dataSource"
              value={firebaseLink}
              checked={dataSource === firebaseLink}
              onChange={() => {}}
            />
            <label htmlFor="firebase">Firebase Realtime Database</label>
          </div>
        </form>
      </div>
    </div>
  );
};

Home.propTypes = {
  dataSource: PropTypes.string.isRequired,
  onDataSourceChange: PropTypes.func.isRequired,
};

export default Home;
