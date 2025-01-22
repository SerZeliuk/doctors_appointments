// src/components/common/Unauthorized.js
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="container mt-5 text-center">
    <h2>403 - Unauthorized</h2>
    <p>You do not have permission to view this page.</p>
    <Link to="/" className="btn btn-primary">
      Go to Home
    </Link>
  </div>
);

export default Unauthorized;
