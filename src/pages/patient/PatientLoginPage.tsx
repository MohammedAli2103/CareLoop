import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Phone, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';

export const PatientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNumber}`;
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });

        if (otpErr) {
          // If SMS provider (Twilio/MessageBird) is not configured in Supabase
          if (
            otpErr.message.toLowerCase().includes('provider') ||
            otpErr.message.toLowerCase().includes('sms') ||
            otpErr.message.toLowerCase().includes('not configured') ||
            otpErr.message.toLowerCase().includes('unsupported')
          ) {
            console.warn('Supabase SMS Provider notice:', otpErr.message);
            // Allow user to proceed to OTP verification screen with clear notice
            sessionStorage.setItem('careloop_pending_phone', fullPhone);
            navigate(`/patient/verify-otp?phone=${encodeURIComponent(fullPhone)}&mode=login&providerNotice=true`);
            return;
          }
          throw otpErr;
        }
      }

      sessionStorage.setItem('careloop_pending_phone', fullPhone);
      navigate(`/patient/verify-otp?phone=${encodeURIComponent(fullPhone)}&mode=login`);
    } catch (err: any) {
      console.error('Phone login error:', err);
      setError(err.message || 'Failed to dispatch SMS verification code. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout showBack backTo="/" maxWidth="max-w-md">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <Phone className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Patient Sign In</h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Enter your mobile number to receive a secure one-time verification code.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex rounded-xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 overflow-hidden shadow-xs">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-slate-50 border-r border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-600/10 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send SMS OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have a patient account yet?{' '}
            <Link to="/patient/register" className="font-semibold text-emerald-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted SMS delivery via Supabase Auth</span>
        </div>
      </div>
    </PortalLayout>
  );
};
