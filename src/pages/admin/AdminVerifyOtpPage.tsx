import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { StepIndicator } from '../../components/auth/StepIndicator';
import { OtpInput } from '../../components/auth/OtpInput';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { MailCheck, Loader2, ShieldCheck } from 'lucide-react';

export const AdminVerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAdminOtpVerified, setDemoUser, user } = useAuth();

  const email = searchParams.get('email') || sessionStorage.getItem('careloop_admin_login_email') || 'admin@careloop.com';
  const isDemo = searchParams.get('demo') === 'true';
  const userId = sessionStorage.getItem('careloop_admin_login_uid') || user?.id || 'demo-admin-id';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Email & Password', 'Email OTP'];

  const handleVerify = async (codeToVerify = otp) => {
    if (codeToVerify.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminService.verifyEmailOtp(userId, codeToVerify);

      if (!res.success) {
        throw new Error(res.message);
      }

      setAdminOtpVerified(true);

      if (isDemo || userId === 'demo-admin-id') {
        setDemoUser({
          id: 'admin-1',
          role: 'admin',
          status: 'active',
          full_name: 'CareLoop Administrator',
          email: email,
        });
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin OTP verification error:', err);
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await adminService.requestEmailOtp(userId, email);
    } catch (err: any) {
      console.warn('Resend error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between">
        <Logo to="/" />
        <Link
          to="/admin/login"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          ← Back to Login
        </Link>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        {/* Stepper step 2 */}
        <div className="mb-6">
          <StepIndicator steps={steps} currentStep={2} />
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm text-center">
          {/* Verification Icon matching Showcase Panel 9 */}
          <div className="w-20 h-20 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5 relative">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <MailCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Verify Email OTP</h1>
          <p className="text-xs text-slate-500 mt-2">
            We've sent a 6-digit code to{' '}
            <strong className="text-slate-800 font-semibold">{email}</strong>
          </p>

          <div className="my-6">
            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
              onResend={handleResend}
              countdownSeconds={45}
              disabled={loading}
              error={error}
            />
          </div>

          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || otp.length !== 6}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/10 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Authorization...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          <div className="mt-6 text-xs text-slate-400">
            <Link to="/admin/login" className="text-sky-600 font-semibold hover:underline">
              Back to sign in
            </Link>
          </div>

          {/* Security details callout */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-left text-[11px] text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Server-Side Hash Enforced</p>
              <p className="text-slate-500 mt-0.5 leading-relaxed">
                Verification requests are processed with rate-limiting, salt hashing, and 5-attempt lockdown.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
