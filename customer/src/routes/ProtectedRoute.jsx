import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, requireVerified = false }) => {
  const { user, loading, emailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Authenticating GO PLMR session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If page requires verified email and user is not verified, redirect to /verify-email
  if (requireVerified && !emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};
