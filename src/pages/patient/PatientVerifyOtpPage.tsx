import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { OtpInput } from '../../components/auth/OtpInput';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MailCheck, Loader2, Info } from 'lucide-react';

export const PatientVerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, setDemoUser } = useAuth();

  const phoneParam = searchParams.get('phone') || sessionStorage.getItem('careloop_pending_phone') || '+91 98765 43210';
  const mode = searchParams.get('mode') || 'login';
  const hasProviderNotice = searchParams.get('providerNotice') === 'true';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (codeToVerify = otp) => {
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured() && !hasProviderNotice) {
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          phone: phoneParam,
          token: codeToVerify,
          type: 'sms',
        });

        if (verifyErr) throw verifyErr;

        if (data?.user) {
          // If in registration mode, ensure patient profile is written to database
          const savedReg = sessionStorage.getItem('careloop_patient_reg_data');
          if (savedReg) {
            const parsed = JSON.parse(savedReg);
            // Insert profile
            await supabase.from('profiles').upsert({
              id: data.user.id,
              role: 'patient',
              status: 'active',
              full_name: parsed.fullName,
              email: parsed.email,
              phone: phoneParam,
            });

            // Insert patient profile details
            await supabase.from('patient_profiles').upsert({
              id: data.user.id,
              date_of_birth: parsed.dateOfBirth,
              gender: parsed.gender,
              blood_group: parsed.bloodGroup || null,
              street_address: parsed.streetAddress || null,
              city: parsed.city || null,
              state: parsed.state || null,
              postal_code: parsed.postalCode || null,
              emergency_contact_name: parsed.emergencyName,
              emergency_contact_relationship: parsed.emergencyRelation,
              emergency_contact_phone: parsed.emergencyPhone,
              consent_terms: parsed.consentTerms,
              consent_privacy: parsed.consentPrivacy,
              consent_data_processing: parsed.consentDataProcessing,
            });
            sessionStorage.removeItem('careloop_patient_reg_data');
          }

          await refreshProfile();
          navigate('/patient/dashboard');
          return;
        }
      }

      // Fallback/Testing handler for unconfigured SMS provider
      const savedReg = sessionStorage.getItem('careloop_patient_reg_data');
      let patientName = 'Robert Miller';
      let patientEmail = 'patient@careloop.com';
      if (savedReg) {
        const parsed = JSON.parse(savedReg);
        patientName = parsed.fullName;
        patientEmail = parsed.email;
      }

      setDemoUser({
        id: 'patient-' + Date.now(),
        role: 'patient',
        status: 'active',
        full_name: patientName,
        email: patientEmail,
        phone: phoneParam,
      });

      navigate('/patient/dashboard');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      if (isSupabaseConfigured() && !hasProviderNotice) {
        await supabase.auth.signInWithOtp({ phone: phoneParam });
      }
    } catch (err: any) {
      console.warn('Resend error:', err);
    }
  };

  return (
    <PortalLayout showBack backTo="/patient/login" maxWidth="max-w-md">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        {/* Verification Icon Matching Showcase */}
        <div className="w-20 h-20 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5 relative">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <MailCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">Verify OTP</h1>
        <p className="text-xs text-slate-500 mt-2">
          We've sent a 6-digit code to{' '}
          <strong className="text-slate-800 font-semibold">{phoneParam}</strong>
        </p>

        {hasProviderNotice && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 flex gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">SMS Provider Required</p>
              <p className="text-[11px] mt-0.5 text-amber-700 leading-relaxed">
                Supabase Phone Auth requires Twilio or MessageBird configured in your Supabase dashboard. In test mode, enter any 6 digits to verify.
              </p>
            </div>
          </div>
        )}

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
              <span>Verifying Code...</span>
            </>
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>

        <div className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1">
          <span>Having trouble?</span>
          <Link
            to={mode === 'register' ? '/patient/register' : '/patient/login'}
            className="text-sky-600 font-semibold hover:underline"
          >
            Change number
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};
