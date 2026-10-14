import React from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Stethoscope,
  Users,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const isPending = profile?.status === 'pending';

  return (
    <PortalLayout maxWidth="max-w-6xl">
      <div className="space-y-6">
        {/* If Staff Account is Pending Approval */}
        {isPending && (
          <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-amber-950">
                    Physician Account Pending Administrator Approval
                  </h2>
                  <StatusBadge status="pending" />
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                  Your medical credentials and license registration have been submitted to the platform administrator. Access to write prescriptions and inspect live patient health records will unlock once your profile is verified.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-200/70 text-amber-900 shrink-0">
              Review Status: In Queue
            </div>
          </div>
        )}

        {/* Doctor Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile?.full_name || 'Dr. Practitioner'}
                </h1>
                <StatusBadge status={profile?.status || 'active'} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cardiology Department • City General Hospital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
            >
              + New Clinical Consultation
            </button>
          </div>
        </div>

        {/* Clinical Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">28</div>
              <div className="text-xs font-medium text-slate-500">Active Patients</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">4</div>
              <div className="text-xs font-medium text-slate-500">Pending Lab Reviews</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">6</div>
              <div className="text-xs font-medium text-slate-500">Tele-Visits Scheduled Today</div>
            </div>
          </div>
        </div>

        {/* Patient Care Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Patient Encounters</h2>
            <span className="text-xs font-semibold text-sky-600 cursor-pointer hover:underline">
              View All Patients →
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <div className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Robert Miller (54 yrs, Male)</p>
                <p className="text-xs text-slate-500">Post-Operative Recovery • Last Visit: 11 Oct</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  Stable
                </span>
                <button type="button" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                  Open Chart
                </button>
              </div>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Priya Sharma (42 yrs, Female)</p>
                <p className="text-xs text-slate-500">Hypertension Management • Last Visit: 09 Oct</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  Follow-up Needed
                </span>
                <button type="button" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                  Open Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
