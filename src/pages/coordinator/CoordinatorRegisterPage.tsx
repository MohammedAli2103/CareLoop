import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ClipboardList,
  Lock,
  Mail,
  User,
  Shield,
  Building2,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const CoordinatorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Patient Care Services',
    organization: '',
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

    if (!formData.organization.trim()) {
      setError('Hospital or Healthcare Organization name is required.');
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
              role: 'coordinator',
            },
          },
        });

        if (signUpErr) throw signUpErr;

        if (data.user) {
          // Insert profile with status pending
          await supabase.from('profiles').insert({
            id: data.user.id,
            role: 'coordinator',
            status: 'pending',
            full_name: formData.fullName,
            email: formData.email.trim(),
            phone: formData.phone || null,
          });

          // Insert coordinator details
          await supabase.from('coordinator_profiles').insert({
            id: data.user.id,
            department: formData.department,
            organization: formData.organization,
          });

          // Record audit event
          await supabase.from('audit_logs').insert({
            actor_id: data.user.id,
            actor_role: 'coordinator',
            actor_email: formData.email.trim(),
            action: 'STAFF_REGISTRATION_REQUESTED',
            target_id: data.user.id,
            target_type: 'coordinator',
            details: {
              department: formData.department,
              organization: formData.organization,
            },
          });
        }
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Coordinator registration error:', err);
      setError(err.message || 'Failed to submit coordinator registration request.');
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
            Your Care Coordinator registration for <strong className="text-slate-800">{formData.fullName}</strong> has been logged.
          </p>
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left">
            <p className="font-bold">Pending Review:</p>
            <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
              Platform administrators must verify your organization credentials (<strong className="font-semibold">{formData.organization}</strong>). Once approved, you can coordinate patient outreach and record verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/coordinator/login')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout showBack backTo="/coordinator/login" maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Coordinator Registration Request</h1>
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
                placeholder="Priya Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
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
                placeholder="priya@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
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
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
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
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500 bg-white"
              >
                <option value="Patient Care Services">Patient Care Services</option>
                <option value="Outreach & Followups">Outreach & Followups</option>
                <option value="Care Plan Management">Care Plan Management</option>
                <option value="Hospital Transitions">Hospital Transitions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Clinic <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="City General Hospital"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
                  required
                />
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
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
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
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

        <div className="mt-6 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Your account will be reviewed by an administrator.</span>
        </div>

        <div className="mt-5 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/coordinator/login" className="font-semibold text-sky-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};
