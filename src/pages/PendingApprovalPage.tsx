import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '../components/layout/PortalLayout';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await refreshProfile();
      if (profile?.status === 'active') {
        if (profile.role === 'doctor') navigate('/doctor');
        else if (profile.role === 'coordinator') navigate('/coordinator');
        else if (profile.role === 'admin') navigate('/admin');
        else navigate('/patient');
      } else {
        setMessage('Your account is still under administrative review. Please check back shortly.');
      }
    } catch {
      setMessage('Unable to verify account status right now. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const roleTitle = profile?.role === 'doctor' ? 'Physician' : 'Care Coordinator';

  return (
    <PortalLayout showBack={false} maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600">
          <Clock className="w-10 h-10 stroke-[2.2] animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" /> Verification In Progress
        </span>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Application Pending Approval
        </h1>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Welcome, <span className="font-semibold text-slate-900">{profile?.full_name || 'Staff Member'}</span>. Your request for <span className="font-semibold text-sky-700">{roleTitle}</span> access has been securely routed to the CareLoop Hospital Administration Team.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Account Role:</span>
            <span className="font-semibold text-slate-800 capitalize">{profile?.role || 'Staff'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Registered Email:</span>
            <span className="font-semibold text-slate-800">{profile?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Account Status:</span>
            <span className="font-semibold text-amber-600 capitalize">{profile?.status || 'Pending'}</span>
          </div>
        </div>

        {message && (
          <div className="mb-5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            {message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Status...' : 'Check Approval Status'}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out & Return Home
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-6">
          Hospital administrators routinely review and verify staff credentials within standard operating hours.
        </p>
      </div>
    </PortalLayout>
  );
};
