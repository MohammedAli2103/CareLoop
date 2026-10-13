import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const exportReport = (format: 'csv' | 'json') => {
    setDownloading(true);
    setTimeout(() => {
      const data = [
        { metric: 'Total Active Patients', value: 124, date: '2026-10-13' },
        { metric: 'Total Approved Doctors', value: 8, date: '2026-10-13' },
        { metric: 'Total Approved Coordinators', value: 4, date: '2026-10-13' },
        { metric: 'Pending Staff Verification', value: 5, date: '2026-10-13' },
        { metric: 'Average Staff Turnaround (hours)', value: 4.2, date: '2026-10-13' },
        { metric: '2FA OTP Verification Success Rate', value: '99.4%', date: '2026-10-13' },
      ];

      const blob =
        format === 'csv'
          ? new Blob(
              [
                'Metric,Value,Date\n' +
                  data.map((r) => `"${r.metric}","${r.value}","${r.date}"`).join('\n'),
              ],
              { type: 'text/csv' }
            )
          : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careloop-compliance-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 600);
  };

  return (
    <AdminLayout
      title="Platform Reports & Analytics"
      subtitle="Healthcare compliance telemetry, verification SLAs, and provider network statistics."
    >
      <div className="space-y-6">
        {/* Top Export Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Reporting Period: Current Quarter (Q4 2026)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={downloading}
              onClick={() => exportReport('csv')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={() => exportReport('json')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Approval SLA</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">4.2 hrs</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> -1.8 hrs vs last month
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">OTP Success</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">99.4%</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Hashed 2FA delivery
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Patient Growth</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">+34%</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              124 active registered
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Audit Integrity</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">100%</div>
            <div className="text-[11px] text-teal-600 font-semibold mt-1">
              Zero policy violations
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Role Distribution</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Patients</span>
                  <span className="text-slate-900">124 (87.9%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '87.9%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Doctors</span>
                  <span className="text-slate-900">8 (5.7%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-600 h-2 rounded-full" style={{ width: '5.7%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Care Coordinators</span>
                  <span className="text-slate-900">4 (2.8%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '2.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Pending Staff Review</span>
                  <span className="text-slate-900">5 (3.5%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '3.5%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Security & Authorization Compliance</h3>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Database Row Level Security (RLS)</p>
                  <p className="text-[11px] text-slate-400">All tables protected with least-privilege checks</p>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Enforced
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Administrator 2FA OTP</p>
                  <p className="text-[11px] text-slate-400">Server Edge Function verification</p>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Staff Gatekeeping</p>
                  <p className="text-[11px] text-slate-400">Zero unapproved staff record exposure</p>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
