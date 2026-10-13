import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { StepIndicator } from '../../components/auth/StepIndicator';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

interface PatientFormData {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  bloodGroup: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentDataProcessing: boolean;
}

export const PatientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PatientFormData>({
    fullName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    consentTerms: false,
    consentPrivacy: false,
    consentDataProcessing: false,
  });

  const steps = ['Personal', 'Medical', 'Address', 'Review'];

  const updateField = (field: keyof PatientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setError('Please enter your full legal name.');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit mobile phone number.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.dateOfBirth) {
        setError('Please select your date of birth.');
        return false;
      }
      if (!formData.gender) {
        setError('Please select your gender.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.emergencyName.trim()) {
        setError('Please provide an emergency contact name.');
        return false;
      }
      if (!formData.emergencyRelation.trim()) {
        setError('Please specify relationship with emergency contact.');
        return false;
      }
      const cleanEmerPhone = formData.emergencyPhone.replace(/\D/g, '');
      if (cleanEmerPhone.length < 10) {
        setError('Please enter a valid emergency contact phone number.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!formData.consentTerms || !formData.consentPrivacy || !formData.consentDataProcessing) {
        setError('You must accept all required terms and privacy policies to complete patient registration.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    setError(null);

    const fullPhone = `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`;

    try {
      // Store registration payload to complete profile creation upon OTP confirmation
      sessionStorage.setItem('careloop_patient_reg_data', JSON.stringify(formData));
      sessionStorage.setItem('careloop_pending_phone', fullPhone);

      if (isSupabaseConfigured()) {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });

        if (otpErr) {
          if (
            otpErr.message.toLowerCase().includes('provider') ||
            otpErr.message.toLowerCase().includes('sms') ||
            otpErr.message.toLowerCase().includes('not configured')
          ) {
            console.warn('Supabase SMS Provider notice:', otpErr.message);
            navigate(`/patient/verify-otp?phone=${encodeURIComponent(fullPhone)}&mode=register&providerNotice=true`);
            return;
          }
          throw otpErr;
        }
      }

      navigate(`/patient/verify-otp?phone=${encodeURIComponent(fullPhone)}&mode=register`);
    } catch (err: any) {
      console.error('Registration dispatch error:', err);
      setError(err.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout showBack backTo="/" maxWidth="max-w-2xl">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
        {/* Stepper Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Create Your Patient Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Let's get to know you and establish your encrypted health profile.
          </p>
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} className="my-6" />

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robert Miller"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. robert.m@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl border border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 overflow-hidden">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => updateField('countryCode', e.target.value)}
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
                    placeholder="Enter mobile number"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Medical Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => updateField('bloodGroup', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 text-xs text-sky-800 leading-relaxed">
                Medical details help doctors provide targeted clinical plans and rapid response in medical emergencies.
              </div>
            </div>
          )}

          {/* STEP 3: Address & Emergency Contact */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 124 Health Avenue, Suite 400"
                  value={formData.streetAddress}
                  onChange={(e) => updateField('streetAddress', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Emergency Contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mary Miller"
                      value={formData.emergencyName}
                      onChange={(e) => updateField('emergencyName', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spouse / Parent"
                      value={formData.emergencyRelation}
                      onChange={(e) => updateField('emergencyRelation', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Consent */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900">{formData.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.countryCode} {formData.phone}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">DOB & Gender:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.dateOfBirth} ({formData.gender})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.emergencyName} ({formData.emergencyRelation}) - {formData.emergencyPhone}
                  </span>
                </div>
              </div>

              {/* Consent check boxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.consentTerms}
                    onChange={(e) => updateField('consentTerms', e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    required
                  />
                  <span>
                    I accept the <strong className="text-slate-900">CareLoop Terms of Service</strong> and agree to patient portal communications.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.consentPrivacy}
                    onChange={(e) => updateField('consentPrivacy', e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    required
                  />
                  <span>
                    I have read and consent to the <strong className="text-slate-900">Privacy Notice & HIPAA Compliance Agreement</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.consentDataProcessing}
                    onChange={(e) => updateField('consentDataProcessing', e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    required
                  />
                  <span>
                    I authorize authorized physicians and care coordinators to process and access my health records.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Verify Phone</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/patient/login" className="font-semibold text-sky-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};
