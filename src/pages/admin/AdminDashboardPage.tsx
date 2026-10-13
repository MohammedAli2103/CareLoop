import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminService } from '../../services/adminService';
import type { AdminStats, StaffApprovalItem, AuditLog } from '../../lib/types';
import {
  FileText,
  UserCheck,
  ClipboardList,
  Users,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalPendingApprovals: 5,
    totalDoctors: 8,
    totalCoordinators: 4,
    totalPatients: 124,
    totalStaff: 17,
  });

  const [pendingApprovals, setPendingApprovals] = useState<StaffApprovalItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [statsData, pendingData, activityData] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingApprovals(),
        adminService.getRecentActivity(5),
      ]);
      setStats(statsData);
      setPendingApprovals(pendingData.slice(0, 4));
      setRecentActivity(activityData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setFeedbackMessage(null);
    try {
      const res = await adminService.approveStaff(id);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: `${name} has been approved and granted active platform access.` });
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    setActionLoadingId(id);
    setFeedbackMessage(null);
    try {
      const res = await adminService.rejectStaff(id, 'Credentials could not be verified with professional medical licensing registry.');
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: `${name}'s request was rejected.` });
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-500 hover:text-slate-800"
            >
              ×
            </button>
          </div>
        )}

        {/* 4 Summary Stat Cards matching UI showcase panel 10 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Pending Approvals Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Approvals
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats.totalPendingApprovals}
              </div>
              <div className="text-[11px] text-slate-400">Doctor / Coordinator requests</div>
            </div>
          </div>

          {/* 2. Total Doctors Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Doctors
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats.totalDoctors}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">Approved</div>
            </div>
          </div>

          {/* 3. Total Coordinators Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Coordinators
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats.totalCoordinators}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold">Approved</div>
            </div>
          </div>

          {/* 4. Total Patients Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Patients
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {stats.totalPatients}
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold">Active</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid matching UI Showcase Panel 10 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Table: Pending Staff Approvals (7 columns) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pending Staff Approvals</h2>
                <p className="text-xs text-slate-400">Review and authorize healthcare provider requests</p>
              </div>
              <Link
                to="/admin/approvals"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Applied On</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-500" />
                      </td>
                    </tr>
                  ) : pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No pending staff applications at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((staff) => {
                      const isActing = actionLoadingId === staff.id;
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 pr-2 font-bold text-slate-800 whitespace-nowrap">
                            {staff.full_name}
                          </td>
                          <td className="py-3.5 pr-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                staff.role === 'doctor'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {staff.role}
                            </span>
                          </td>
                          <td className="py-3.5 pr-2 text-slate-500 whitespace-nowrap">
                            {staff.email}
                          </td>
                          <td className="py-3.5 pr-2 text-slate-400 whitespace-nowrap">
                            {formatDate(staff.created_at)}
                          </td>
                          <td className="py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={() => handleApprove(staff.id, staff.full_name)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                              >
                                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                              </button>
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={() => handleReject(staff.id, staff.full_name)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Middle/Right: Recent Activity (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recent Activity Card matching Showcase */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                <Link
                  to="/admin/activity"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-4">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0 ring-4 ring-sky-100" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {act.details?.name || act.details?.patientName || act.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(act.created_at)} • {act.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Overview Donut Card matching Showcase Panel 10 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">System Overview</h2>

              <div className="flex items-center justify-around py-3">
                {/* Circular Donut Representation */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-8 border-sky-500 border-t-emerald-500 border-r-amber-400 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xl font-black text-slate-900">{stats.totalStaff}</span>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Total Staff
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Doctors:</span>
                    <strong className="text-slate-900 font-bold">{stats.totalDoctors}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600">Coordinators:</span>
                    <strong className="text-slate-900 font-bold">{stats.totalCoordinators}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-slate-600">Pending:</span>
                    <strong className="text-slate-900 font-bold">{stats.totalPendingApprovals}</strong>
                  </div>
                </div>
              </div>

              {/* Quick Actions matching panel 10 */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/approvals')}
                  className="flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                >
                  View Pending Approvals
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Manage Users
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/activity')}
                  className="py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
