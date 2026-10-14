import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { PatientLoginPage } from './pages/patient/PatientLoginPage';
import { PatientRegisterPage } from './pages/patient/PatientRegisterPage';
import { PatientVerifyOtpPage } from './pages/patient/PatientVerifyOtpPage';
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';

import { DoctorLoginPage } from './pages/doctor/DoctorLoginPage';
import { DoctorRegisterPage } from './pages/doctor/DoctorRegisterPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';

import { CoordinatorLoginPage } from './pages/coordinator/CoordinatorLoginPage';
import { CoordinatorRegisterPage } from './pages/coordinator/CoordinatorRegisterPage';
import { CoordinatorDashboardPage } from './pages/coordinator/CoordinatorDashboardPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminVerifyOtpPage } from './pages/admin/AdminVerifyOtpPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing / Role Selection */}
          <Route path="/" element={<RoleSelectionPage />} />

          {/* Patient Routes */}
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />
          <Route path="/patient/verify-otp" element={<PatientVerifyOtpPage />} />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route path="/doctor/login" element={<DoctorLoginPage />} />
          <Route path="/doctor/register" element={<DoctorRegisterPage />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Care Coordinator Routes */}
          <Route path="/coordinator/login" element={<CoordinatorLoginPage />} />
          <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />
          <Route
            path="/coordinator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Administrator Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
