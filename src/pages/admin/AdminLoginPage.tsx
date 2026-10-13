import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { StepIndicator } from '../../components/auth/StepIndicator';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { adminService } from '../../services/adminService';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
  Info,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@careloop.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Email & Password', 'Email OTP'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authErr) throw authErr;

        if (data?.user) {
          // Check role in profiles
          const { data: profileData, error: profErr } = await supabase
            .from('profiles')
            .select('role, status, full_name')
            .eq('id', data.user.id)
            .single();

          if (profErr || !profileData || profileData.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied: This account does not possess administrator privileges.');
          }

          if (profileData.status !== 'active') {
            await supabase.auth.signOut();
            throw new Error('Administrator account is deactivated or suspended.');
          }

          // Trigger server-verified email OTP dispatch
          await adminService.requestEmailOtp(data.user.id, email.trim());

          sessionStorage.setItem('careloop_admin_login_email', email.trim());
          sessionStorage.setItem('careloop_admin_login_uid', data.user.id);

          navigate(`/admin/verify-otp?email=${encodeURIComponent(email.trim())}`);
          return;
        }
      }

      // Demo administrator fallback (for initial inspection & review before provisioning)
      sessionStorage.setItem('careloop_admin_login_email', email.trim());
      sessionStorage.setItem('careloop_admin_login_uid', 'demo-admin-id');
      navigate(`/admin/verify-otp?email=${encodeURIComponent(email.trim())}&demo=true`);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Authentication failed. Please verify administrator email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between">
        <Logo to="/" />
        <Link
          to="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          ← Back to Roles
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        {/* Stepper matching panel 8 */}
        <div className="mb-6">
          <StepIndicator steps={steps} currentStep={1} />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Security Trust Banner matching Showcase */}
          <div className="md:col-span-5 bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-6 border border-white/20 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Administrator Access</h2>
              <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
                Secure login for system administrator only. Protected by two-factor verification.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 text-xs text-white/75 space-y-2.5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-200" />
                <span>Zero Public Signup Privileges</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>HMAC / SHA-256 Hashed OTP</span>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Administrator Sign In</h1>
              <p className="text-xs text-slate-500 mt-1">Enter credentials to initiate 2FA verification</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@careloop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Informational Callout matching panel 8 */}
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center gap-2.5 text-xs text-sky-800">
                <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                <span>We'll send a 6-digit code to your email for verification.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/10 disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                Administrator accounts cannot be registered publicly. They must be provisioned via private database migration.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
