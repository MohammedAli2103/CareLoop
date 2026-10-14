import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Database,
  Mail,
  Phone,
  Key,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const sqlProvisionSnippet = `-- Execute in Supabase SQL Editor to provision the first Administrator:
INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '<SUPABASE_AUTH_USER_UUID>',
  'admin',
  'active',
  'System Administrator',
  'admin@careloop.com',
  '+15550001122'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlProvisionSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <AdminLayout
      title="Platform Settings & Security"
      subtitle="Infrastructure connection, provider integrations, and administrative credential governance."
    >
      <div className="space-y-6 max-w-4xl">
        {/* Supabase Connection Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Supabase Backend Status</h3>
                <p className="text-xs text-slate-400">PostgreSQL database, Row Level Security, and Edge Functions</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isSupabaseConfigured() ? 'Connected' : 'Environment Pending'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-400 font-medium">Project Host URL</div>
              <div className="font-mono font-bold text-slate-800 mt-1 truncate">
                https://zgbxpxhvjjixtikopzfu.supabase.co
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-400 font-medium">Client API Key</div>
              <div className="font-mono font-bold text-emerald-700 mt-1">
                Active (VITE_SUPABASE_PUBLISHABLE_KEY)
              </div>
            </div>
          </div>
        </div>

        {/* External Provider Requirements & Delivery Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-2">Provider Configuration Checklist</h3>
          <p className="text-xs text-slate-500 mb-4">
            Required third-party provider credentials to ensure production delivery of OTPs:
          </p>

          <div className="space-y-3 text-xs">
            {/* SMS Provider */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100/60 text-emerald-700 rounded-xl mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Patient SMS Provider (Twilio / MessageBird)</h4>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                    Required for Patient Phone OTP delivery. Configure under Supabase Dashboard &gt; Authentication &gt; Providers &gt; Phone.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                Setup Guide
              </span>
            </div>

            {/* Email Provider */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-100/60 text-sky-700 rounded-xl mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Administrator Email OTP Provider (Resend / SMTP)</h4>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                    Required for 2FA email delivery to administrators. Configure <code>RESEND_API_KEY</code> in Supabase Edge Function secrets.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                Setup Guide
              </span>
            </div>
          </div>
        </div>

        {/* Administrator Provisioning Snippet */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Secure Administrator Provisioning</h3>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL' : 'Copy SQL'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Public registration for administrators is prohibited by database policies. To grant admin access to a new user, create their auth account in Supabase Studio, then run:
          </p>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto">
            {sqlProvisionSnippet}
          </pre>
        </div>

        {/* Sign Out Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Administration Console</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};
