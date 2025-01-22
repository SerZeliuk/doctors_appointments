// src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute component to guard routes based on authentication and roles.
 *
 * @param {React.Component} children - The component to render if access is granted.
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route.
 */


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but role not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

ProtectedRoute.defaultProps = {
  allowedRoles: null,
};

export default ProtectedRoute;
