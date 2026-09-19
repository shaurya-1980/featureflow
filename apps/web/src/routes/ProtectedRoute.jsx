/**
 * routes/ProtectedRoute.jsx
 *
 * Wraps any route that requires authentication.
 * - While loading (initial session check in progress): shows a spinner so the
 *   user doesn't see a flash-redirect to /login while the silent refresh runs.
 * - If not authenticated: redirects to /login, preserving the attempted URL in
 *   the `state` so LoginPage can redirect back after successful login.
 * - If authenticated: renders the child element.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Pass the current location so we can redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
