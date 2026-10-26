import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/auth/Login';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { DriversPage } from '@/pages/drivers/DriversPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { RidesPage } from '@/pages/rides/RidesPage';
import { LiveMonitoringPage } from '@/pages/monitoring/LiveMonitoringPage';
import { FareSettingsPage } from '@/pages/fares/FareSettingsPage';
import { PaymentsPage } from '@/pages/payments/PaymentsPage';
import { HelmetCompliancePage } from '@/pages/helmet/HelmetCompliancePage';
import { ComplaintsPage } from '@/pages/complaints/ComplaintsPage';
import { ServiceAreaPage } from '@/pages/serviceArea/ServiceAreaPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage';
import { AdminSetupPage } from '@/pages/setup/AdminSetupPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/live-monitoring" element={<LiveMonitoringPage />} />
          <Route path="/fare-settings" element={<FareSettingsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/helmet-compliance" element={<HelmetCompliancePage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/service-area" element={<ServiceAreaPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin-setup" element={<AdminSetupPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
