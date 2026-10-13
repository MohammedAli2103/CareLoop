import React, { useState } from 'react';
import { CareTask } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { CountdownBadge } from '../ui/CountdownBadge';
import { 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Filter, 
  Eye, 
  FileCheck2,
  Calendar
} from 'lucide-react';

interface CareGapRadarTableProps {
  tasks: CareTask[];
  onOpenDetails: (task: CareTask) => void;
  onOpenVerify: (task: CareTask) => void;
  onOpenReview: (task: CareTask) => void;
}

export const CareGapRadarTable: React.FC<CareGapRadarTableProps> = ({
  tasks,
  onOpenDetails,
  onOpenVerify,
  onOpenReview
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'All' && task.taskStatus !== statusFilter) return false;
    if (typeFilter !== 'All' && task.taskType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchPatient = task.patientName.toLowerCase().includes(q);
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchFacility = (task.partnerFacility || '').toLowerCase().includes(q);
      if (!matchPatient && !matchTitle && !matchFacility) return false;
    }
    return true;
  });

  const overdueCount = tasks.filter(t => t.taskStatus === 'Overdue').length;
  const awaitingVerifyCount = tasks.filter(t => t.taskStatus === 'In Progress').length;
  const awaitingReviewCount = tasks.filter(t => t.taskStatus === 'Verified').length;

  return (
    <div className="space-y-4">
      {/* Radar High-Level Pulse Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl border transition-all ${
          overdueCount > 0 
            ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Overdue Care Gaps
            </span>
            <span className="text-xl font-bold font-mono text-rose-700">{overdueCount}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Tasks past SLA deadline without lab receipt. Reassigned to coordinator.
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 text-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-sky-600" /> Awaiting Staff Audit
            </span>
            <span className="text-xl font-bold font-mono text-sky-700">{awaitingVerifyCount}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Uploaded PDFs with draft OCR awaiting side-by-side human confirmation.
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200 text-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Awaiting Doctor Review
            </span>
            <span className="text-xl font-bold font-mono text-teal-700">{awaitingReviewCount}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Staff-verified findings pending physician sign-off and loop closure.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by patient name, test title, or lab facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:border-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="Overdue">Overdue (Escalated)</option>
              <option value="In Progress">In Progress (Awaiting Audit)</option>
              <option value="Verified">Verified (Awaiting Doctor)</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved (Closed)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-semibold text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:border-teal-500"
            >
              <option value="All">All Task Types</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Specialist Referral">Specialist Referral</option>
              <option value="Imaging">Imaging</option>
              <option value="Follow-Up Visit">Follow-Up Visit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Radar Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Patient &amp; MRN</th>
                <th className="py-3 px-4">Diagnostic Task</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Responsible Actor</th>
                <th className="py-3 px-4 text-right">Radar Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No care tasks match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = task.taskStatus === 'Overdue';
                  const isReadyForVerify = task.taskStatus === 'In Progress' && task.report;
                  const isReadyForReview = task.taskStatus === 'Verified';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Patient & MRN */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{task.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {task.patientId}
                        </div>
                      </td>

                      {/* Diagnostic Task */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                            {task.taskType}
                          </span>
                          <span>• {task.partnerFacility || 'MetroPath Lab'}</span>
                        </div>
                      </td>

                      {/* Deadline Countdown */}
                      <td className="py-3 px-4">
                        <CountdownBadge deadline={task.deadline} isResolved={task.taskStatus === 'Resolved'} />
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Workflow Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={task.taskStatus} size="sm" />
                        {task.isEscalated && (
                          <div className="text-[10px] text-rose-700 font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Escalated to Radar
                          </div>
                        )}
                      </td>

                      {/* Responsible Actor */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 capitalize">
                          {task.assignedRole}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {task.assignedRole === 'coordinator' 
                            ? 'Nida Ali (Care Coordinator)' 
                            : task.assignedRole === 'doctor' 
                              ? task.doctorName 
                              : 'Patient Self-Care'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReadyForVerify && (
                            <button
                              onClick={() => onOpenVerify(task)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
                            >
                              Audit OCR
                            </button>
                          )}

                          {isReadyForReview && (
                            <button
                              onClick={() => onOpenReview(task)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                            >
                              Doctor Review
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDetails(task)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Full Task Context & Audit History"
                          >
                            <Eye className="w-4 h-4" />
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
    </div>
  );
};
