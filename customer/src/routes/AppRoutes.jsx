import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Home } from '../pages/home/Home';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { VerifyEmail } from '../pages/auth/VerifyEmail';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { RideHistoryPage } from '../pages/rides/RideHistoryPage';
import { RideDetailsPage } from '../pages/rides/RideDetailsPage';
import { SavedPlacesPage } from '../pages/places/SavedPlacesPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { SupportPage } from '../pages/profile/SupportPage';

import { WelcomePage } from '../pages/auth/WelcomePage';
import { PermissionsPage } from '../pages/auth/PermissionsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/permissions" element={<PermissionsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main App Routes inside Customer Shell */}
      <Route element={<CustomerLayout />}>
        {/* Home is accessible to browse, with booking gated by auth/verification */}
        <Route path="/" element={<Home />} />

        {/* Protected Customer Routes */}
        <Route
          path="/rides"
          element={
            <ProtectedRoute>
              <RideHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/:rideId"
          element={
            <ProtectedRoute>
              <RideDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/places"
          element={
            <ProtectedRoute>
              <SavedPlacesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
