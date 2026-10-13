import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Lock, Mail, Eye, EyeOff, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

export const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile, setDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        if (data.user) {
          await refreshProfile();
          navigate('/doctor/dashboard');
          return;
        }
      }

      // Demo/Fallback doctor login
      setDemoUser({
        id: '11111111-1111-4111-a111-111111111111',
        role: 'doctor',
        status: email.includes('pending') ? 'pending' : 'active',
        full_name: 'Dr. Arjun Mehta, MD',
        email: email || 'dr.mehta@careloop-health.org',
      });

      navigate('/doctor/dashboard');
    } catch (err: any) {
      console.error('Doctor sign in error:', err);
      setError(err.message || 'Invalid email address or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout showBack backTo="/" maxWidth="max-w-md">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        {/* Doctor Illustration / Avatar Matching Showcase */}
        <div className="w-20 h-20 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Stethoscope className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Doctor Sign In</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
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
                placeholder="doctor@hospital.com"
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to reset physician credentials.'); }} className="text-sky-600 font-semibold hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/10 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          New to CareLoop?{' '}
          <Link to="/doctor/register" className="font-semibold text-sky-600 hover:underline">
            Create account
          </Link>
        </div>

        {/* Access requires admin approval banner */}
        <div className="mt-6 p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-center gap-2 text-xs text-sky-800 font-medium">
          <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Access requires admin approval.</span>
        </div>
      </div>
    </PortalLayout>
  );
};
