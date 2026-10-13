import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Auth & Onboarding Pages
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { PatientLoginPage } from './pages/patient/PatientLoginPage';
import { PatientRegisterPage } from './pages/patient/PatientRegisterPage';
import { PatientVerifyOtpPage } from './pages/patient/PatientVerifyOtpPage';

import { DoctorLoginPage } from './pages/doctor/DoctorLoginPage';
import { DoctorRegisterPage } from './pages/doctor/DoctorRegisterPage';

import { CoordinatorLoginPage } from './pages/coordinator/CoordinatorLoginPage';
import { CoordinatorRegisterPage } from './pages/coordinator/CoordinatorRegisterPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminVerifyOtpPage } from './pages/admin/AdminVerifyOtpPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';

// Protected Dashboards & Portals
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { CoordinatorDashboardPage } from './pages/coordinator/CoordinatorDashboardPage';

// Admin Subpages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Standalone Demo Switcher
import { DemoPortalPage } from './pages/DemoPortalPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Landing & Role Selection (Showcase Screen 1) */}
          <Route path="/" element={<RoleSelectionPage />} />
          <Route path="/roles" element={<RoleSelectionPage />} />

          {/* 2. Patient Authentication Flow (Showcase Screens 2 & 3) */}
          <Route path="/login/patient" element={<PatientLoginPage />} />
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/register/patient" element={<PatientRegisterPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />
          <Route path="/verify-otp" element={<PatientVerifyOtpPage />} />
          <Route path="/patient/verify-otp" element={<PatientVerifyOtpPage />} />

          {/* 3. Doctor Authentication Flow (Showcase Screens 4 & 5) */}
          <Route path="/login/doctor" element={<DoctorLoginPage />} />
          <Route path="/doctor/login" element={<DoctorLoginPage />} />
          <Route path="/register/doctor" element={<DoctorRegisterPage />} />
          <Route path="/doctor/register" element={<DoctorRegisterPage />} />

          {/* 4. Care Coordinator Authentication Flow (Showcase Screens 6 & 7) */}
          <Route path="/login/coordinator" element={<CoordinatorLoginPage />} />
          <Route path="/coordinator/login" element={<CoordinatorLoginPage />} />
          <Route path="/register/coordinator" element={<CoordinatorRegisterPage />} />
          <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />

          {/* 5. Administrator Authentication Flow (Showcase Screens 8 & 9) */}
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />

          {/* 6. Pending Staff Approval Notice */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* 7. Patient Portal (Protected) */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 8. Doctor Portal (Protected) */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 9. Care Coordinator Portal (Protected) */}
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/*"
            element={
              <ProtectedRoute allowedRoles={['coordinator']}>
                <CoordinatorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 10. Administrator Portal (Showcase Screen 10) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
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

          {/* 11. Multi-Persona Demo Switcher */}
          <Route path="/demo" element={<DemoPortalPage />} />

          {/* 12. 404 Not Found Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
