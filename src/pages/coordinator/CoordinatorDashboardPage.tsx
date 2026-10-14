import React from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PhoneCall,
  FileSpreadsheet,
} from 'lucide-react';

export const CoordinatorDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const isPending = profile?.status === 'pending';

  return (
    <PortalLayout maxWidth="max-w-6xl">
      <div className="space-y-6">
        {/* Pending Approval Notice */}
        {isPending && (
          <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-amber-950">
                    Coordinator Account Pending Administrator Approval
                  </h2>
                  <StatusBadge status="pending" />
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                  Your coordinator profile is currently awaiting administrator verification. Once cleared, you will have access to patient task tracking, verification queues, and physician scheduling.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-200/70 text-amber-900 shrink-0">
              Verification in Progress
            </div>
          </div>
        )}

        {/* Coordinator Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile?.full_name || 'Care Coordinator'}
                </h1>
                <StatusBadge status={profile?.status || 'active'} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Patient Care Services • City General Hospital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              + Add Patient Follow-up Task
            </button>
          </div>
        </div>

        {/* Coordinator Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">42</div>
              <div className="text-xs font-medium text-slate-500">Assigned Patients</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">7</div>
              <div className="text-xs font-medium text-slate-500">Due Follow-up Calls</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">19</div>
              <div className="text-xs font-medium text-slate-500">Tasks Completed Today</div>
            </div>
          </div>
        </div>

        {/* Daily Coordinator Action Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Scheduled Outreach & Verification Tasks</h2>
            <span className="text-xs font-semibold text-amber-600 cursor-pointer hover:underline">
              Export Roster →
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <div className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600 mt-0.5">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Robert Miller — Day 3 Post-Op Wellness Check</p>
                  <p className="text-xs text-slate-500">Confirm medication adherence and pain management score</p>
                </div>
              </div>
              <button type="button" className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors">
                Log Call Outcome
              </button>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Priya Sharma — Upload Specialist Echo Report</p>
                  <p className="text-xs text-slate-500">Attach Cardiology diagnostic files to active EHR file</p>
                </div>
              </div>
              <button type="button" className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                Verify Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
