import React from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  FileText,
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const PatientDashboardPage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <PortalLayout maxWidth="max-w-6xl">
      <div className="space-y-6">
        {/* Welcome Greeting Card */}
        <div className="bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> CareLoop Patient Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {profile?.full_name || 'Patient'}!
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
              Your personalized health journey and care team are active. Next scheduled follow-up is in 3 days.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-xs text-white/70">Health ID</div>
              <div className="text-sm font-bold text-white mt-0.5">CLP-89241</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-xs text-white/70">Assigned Doctor</div>
              <div className="text-sm font-bold text-white mt-0.5">Dr. Sarah Jenkins</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-xs text-white/70">Care Coordinator</div>
              <div className="text-sm font-bold text-white mt-0.5">Michael Chang</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-xs text-white/70">Care Plan Status</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> On Track
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Care Track */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Care Plan</h2>
                  <p className="text-xs text-slate-500">Post-Operative Recovery & Rehabilitation</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 2 of 4
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Weekly Milestone Completion</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-teal-400 h-2.5 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Daily Blood Pressure Log</p>
                      <p className="text-[11px] text-slate-500">Logged today at 08:30 AM (120/80 mmHg)</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Completed</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Evening Mobility Exercise (15 min)</p>
                      <p className="text-[11px] text-slate-500">Scheduled for 06:00 PM</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold">Pending</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Post-Meal Medication (Metformin 500mg)</p>
                      <p className="text-[11px] text-slate-500">Take with dinner</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Upcoming</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support & Upcoming Consultations */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Visit</h2>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                <span className="text-[11px] font-bold text-sky-700 uppercase">Tele-Consultation</span>
                <p className="text-sm font-bold text-slate-900 mt-1">Dr. Sarah Jenkins</p>
                <p className="text-xs text-slate-500 mt-0.5">Cardiovascular Follow-up</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-sky-800">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thursday, Oct 16 • 10:30 AM</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
              >
                Join Video Call Room
              </button>
            </div>

            {/* Reports Snippet */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Lab Reports</h2>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Comprehensive Metabolic Panel</p>
                    <p className="text-[10px] text-slate-400">Verified by Dr. Rao • 10 Oct</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Normal
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Lipid Profile Screen</p>
                    <p className="text-[10px] text-slate-400">Verified by Dr. Rao • 02 Oct</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Normal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
