import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Stethoscope,
  Lock,
  Mail,
  User,
  Shield,
  FileCheck2,
  Building2,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const DoctorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    specialization: 'Cardiology',
    hospitalDepartment: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!formData.licenseNumber.trim()) {
      setError('Medical License Number is required for credential verification.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: 'doctor',
            },
          },
        });

        if (signUpErr) throw signUpErr;

        if (data.user) {
          // Insert pending profile
          await supabase.from('profiles').insert({
            id: data.user.id,
            role: 'doctor',
            status: 'pending',
            full_name: formData.fullName,
            email: formData.email.trim(),
            phone: formData.phone || null,
          });

          // Insert doctor credential record
          await supabase.from('doctor_profiles').insert({
            id: data.user.id,
            medical_license_number: formData.licenseNumber.trim(),
            specialization: formData.specialization,
            hospital_department: formData.hospitalDepartment || 'Clinical Medicine',
          });

          // Record audit log
          await supabase.from('audit_logs').insert({
            actor_id: data.user.id,
            actor_role: 'doctor',
            actor_email: formData.email.trim(),
            action: 'STAFF_REGISTRATION_REQUESTED',
            target_id: data.user.id,
            target_type: 'doctor',
            details: {
              license: formData.licenseNumber,
              specialization: formData.specialization,
            },
          });
        }
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Doctor registration error:', err);
      setError(err.message || 'Failed to submit registration request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <PortalLayout showBack backTo="/" maxWidth="max-w-md">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Request Submitted!</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your physician registration request for <strong className="text-slate-800">{formData.fullName}</strong> has been logged.
          </p>
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left">
            <p className="font-bold">Next Steps:</p>
            <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
              CareLoop administrators will review your medical license number (<strong className="font-mono">{formData.licenseNumber}</strong>) against the medical council registry. You will receive an approval notice upon completion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/doctor/login')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout showBack backTo="/doctor/login" maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Registration Request</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an account to request access. Your profile will be reviewed by the administrator.
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Dr. Rajesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="rajesh@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical License Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. MCI-84920-K"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500 font-mono text-xs"
                  required
                />
                <FileCheck2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specialization <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500 bg-white"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital / Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="City General Hospital / Cardiovascular Care"
                value={formData.hospitalDepartment}
                onChange={(e) => setFormData({ ...formData, hospitalDepartment: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
                required
              />
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/10 disabled:opacity-70 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        </form>

        {/* Info callout */}
        <div className="mt-6 p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center gap-2.5 text-xs text-sky-800">
          <Shield className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Your account will be reviewed by an administrator.</span>
        </div>

        <div className="mt-5 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/doctor/login" className="font-semibold text-sky-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};
