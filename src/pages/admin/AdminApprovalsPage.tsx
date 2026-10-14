import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminService } from '../../services/adminService';
import type { StaffApprovalItem } from '../../lib/types';
import {
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  Eye,
} from 'lucide-react';

export const AdminApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<StaffApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'coordinator'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Medical credentials could not be verified with state registry.');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingApprovals();
      setApprovals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setActionLoadingId(id);
    setAlert(null);
    try {
      const res = await adminService.approveStaff(id);
      if (res.success) {
        setAlert({ type: 'success', text: `${name} has been approved and granted active credentials.` });
        if (selectedStaff?.id === id) setSelectedStaff(null);
        await fetchApprovals();
      } else {
        setAlert({ type: 'error', text: res.message });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId) return;
    setActionLoadingId(rejectTargetId);
    setShowRejectModal(false);
    setAlert(null);
    try {
      const res = await adminService.rejectStaff(rejectTargetId, rejectReason);
      if (res.success) {
        setAlert({ type: 'success', text: 'Staff request rejected successfully.' });
        if (selectedStaff?.id === rejectTargetId) setSelectedStaff(null);
        await fetchApprovals();
      } else {
        setAlert({ type: 'error', text: res.message });
      }
    } finally {
      setActionLoadingId(null);
      setRejectTargetId(null);
    }
  };

  const filtered = approvals.filter((item) => {
    if (roleFilter !== 'all' && item.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = item.full_name.toLowerCase().includes(q);
      const emailMatch = item.email.toLowerCase().includes(q);
      const licenseMatch = item.doctor_details?.medical_license_number?.toLowerCase().includes(q);
      return nameMatch || emailMatch || licenseMatch;
    }
    return true;
  });

  return (
    <AdminLayout
      title="Staff Approvals & Verification"
      subtitle="Review pending medical licenses, verify credentials, and grant platform access."
    >
      <div className="space-y-6">
        {alert && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{alert.text}</span>
            <button type="button" onClick={() => setAlert(null)} className="text-slate-500 hover:text-slate-800">
              ×
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, email, or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Role:
            </span>
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  roleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({approvals.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('doctor')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  roleFilter === 'doctor' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Doctors
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('coordinator')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  roleFilter === 'coordinator' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Coordinators
              </button>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Provider</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Professional Credentials</th>
                  <th className="py-3 px-6">Submission Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                      Loading verification queue...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No matching pending requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((staff) => {
                    const isActing = actionLoadingId === staff.id;
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{staff.full_name}</div>
                          <div className="text-[11px] text-slate-400">{staff.email}</div>
                          {staff.phone && <div className="text-[10px] text-slate-400">{staff.phone}</div>}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              staff.role === 'doctor'
                                ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {staff.role === 'doctor' ? (
                            <div>
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {staff.doctor_details?.medical_license_number || 'Pending Entry'}
                              </span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {staff.doctor_details?.specialization} • {staff.doctor_details?.hospital_department}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-800">
                                {staff.coordinator_details?.department || 'Patient Care'}
                              </span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {staff.coordinator_details?.organization}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          {new Date(staff.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStaff(staff)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                              title="Inspect credentials"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleApprove(staff.id, staff.full_name)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => openRejectModal(staff.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
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

        {/* Credential Inspection Modal */}
        {selectedStaff && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Credential Verification</h3>
                    <p className="text-xs text-slate-400 capitalize">{selectedStaff.role} Application</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-800">{selectedStaff.email}</span>
                  </div>
                  {selectedStaff.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-semibold text-slate-800">{selectedStaff.phone}</span>
                    </div>
                  )}
                  {selectedStaff.doctor_details && (
                    <>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-500">Medical License:</span>
                        <span className="font-mono font-bold text-sky-700">
                          {selectedStaff.doctor_details.medical_license_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Specialization:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStaff.doctor_details.specialization}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hospital Department:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStaff.doctor_details.hospital_department}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedStaff.coordinator_details && (
                    <>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStaff.coordinator_details.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Affiliated Organization:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStaff.coordinator_details.organization}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedStaff.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedStaff.id, selectedStaff.full_name)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Confirm & Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-2">Specify Rejection Reason</h3>
              <p className="text-xs text-slate-500 mb-4">
                This explanation will be logged in the permanent audit trail.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
