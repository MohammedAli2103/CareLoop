import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdminOtp?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdminOtp = true,
}) => {
  const { user, profile, isLoading, isAdminOtpVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Securing CareLoop session...</p>
      </div>
    );
  }

  // Not logged in
  if (!user && !profile) {
    // Determine best fallback login route based on path
    let redirectPath = '/';
    if (location.pathname.startsWith('/admin')) redirectPath = '/admin/login';
    else if (location.pathname.startsWith('/doctor')) redirectPath = '/doctor/login';
    else if (location.pathname.startsWith('/coordinator')) redirectPath = '/coordinator/login';
    else if (location.pathname.startsWith('/patient')) redirectPath = '/patient/login';

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  const role = profile?.role;

  // Check role authorization
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (role === 'coordinator') return <Navigate to="/coordinator/dashboard" replace />;
    if (role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Admin 2FA check
  if (role === 'admin' && requireAdminOtp && !isAdminOtpVerified && location.pathname !== '/admin/verify-otp') {
    return <Navigate to="/admin/verify-otp" replace />;
  }

  return <>{children}</>;
};
