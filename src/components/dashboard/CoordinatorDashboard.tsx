import React, { useState } from 'react';
import { CareTask, User } from '../../types';
import { 
  AlertCircle, 
  FileText, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Calendar, 
  Shield, 
  ArrowRight, 
  Clock, 
  Zap, 
  MoreVertical,
  Search
} from 'lucide-react';

interface CoordinatorDashboardProps {
  coordinator: User;
  tasks: CareTask[];
  onOpenTaskDetails: (task: CareTask) => void;
  onOpenVerify: (task: CareTask) => void;
  onOpenReview: (task: CareTask) => void;
  onSimulateTimeLeap: () => void;
  onNotifyDoctor?: (task: CareTask) => void;
  onNotifyPatient?: (task: CareTask) => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  coordinator,
  tasks,
  onOpenTaskDetails,
  onOpenVerify,
  onOpenReview,
  onSimulateTimeLeap,
  onNotifyDoctor,
  onNotifyPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'lab' | 'imaging' | 'visit'>('all');
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Filter queues
  const overdueTasks = tasks.filter(t => t.taskStatus === 'Overdue');
  const verifyTasks = tasks.filter(t => t.taskStatus === 'In Progress' && t.report && t.report.verificationStatus !== 'Verified');
  const waitingForDoctorTasks = tasks.filter(t => t.taskStatus === 'Verified');
  const completedTasksCount = tasks.filter(t => t.taskStatus === 'Resolved').length;

  // Filtered overdue list based on search/type
  const filteredOverdue = overdueTasks.filter(t => {
    const matchesSearch = !searchQuery || 
      t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'lab') return t.taskType === 'Lab Test';
    if (activeFilter === 'imaging') return t.taskType === 'Imaging';
    if (activeFilter === 'visit') return t.taskType === 'Follow-Up Visit' || t.taskType === 'Specialist Referral';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Date Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Banner */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#dff1ff] via-[#e7f5ff] to-[#d8effe] p-6 sm:p-8 border border-sky-100/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] flex items-center gap-2">
              <span>Good Morning, {coordinator.fullName.split(' ')[0] || 'Nida'}!</span>
              <span className="text-2xl">☀️</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Here&apos;s what needs your attention today.
            </p>
          </div>

          {/* Coordinator Avatar & Quote Bubble */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 z-10">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-cyan-200 to-sky-100 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                  alt="Nida Ali"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-white/80 shadow-xs flex items-center gap-3 max-w-[210px]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1b64f2] text-white shadow-2xs">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#1e293b] leading-snug">
                Your work helps ensure no patient is left behind.
              </p>
            </div>
          </div>
        </div>

        {/* Right Date Card + SLA Simulation Control */}
        <div className="lg:col-span-4 rounded-3xl bg-[#edf5fd] border border-blue-100/90 p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-[#1b64f2]">
              <Calendar className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-[#0f172a]">
                Tuesday, 13 Oct 2026
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Keep the care journey on track for every patient.
            </p>
          </div>

          <div className="pt-4 border-t border-blue-100/60 mt-3">
            <button
              onClick={onSimulateTimeLeap}
              className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-2xs transition-colors"
              title="Demo feature: simulate an SLA deadline breach past 48h to demonstrate safety-net escalation"
            >
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Simulate Overdue SLA (+48h)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Overdue Tasks */}
        <div className="rounded-2xl border border-rose-100 bg-[#fef2f2] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {overdueTasks.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Overdue Tasks
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 shrink-0" />
        </div>

        {/* Card 2: Reports to Verify */}
        <div className="rounded-2xl border border-amber-100 bg-[#fffdf0] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {verifyTasks.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Reports to Verify
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
        </div>

        {/* Card 3: Waiting for Doctor Review */}
        <div className="rounded-2xl border border-blue-100 bg-[#eff6ff] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1b64f2]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {waitingForDoctorTasks.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Waiting for Doctor Review
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
        </div>

        {/* Card 4: Completed This Month */}
        <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {completedTasksCount}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Completed This Month
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Overdue Tasks + Waiting for Doctor Review */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Overdue Tasks Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                    Overdue Tasks
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    These tasks have missed their deadlines and need action.
                  </p>
                </div>
              </div>
              <button className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1 self-start sm:self-center">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Search / Filter bar */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter overdue patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#1b64f2] focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg ${activeFilter === 'all' ? 'bg-[#1b64f2] text-white' : 'hover:bg-slate-100'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('lab')}
                  className={`px-2.5 py-1 rounded-lg ${activeFilter === 'lab' ? 'bg-[#1b64f2] text-white' : 'hover:bg-slate-100'}`}
                >
                  Labs
                </button>
                <button
                  onClick={() => setActiveFilter('visit')}
                  className={`px-2.5 py-1 rounded-lg ${activeFilter === 'visit' ? 'bg-[#1b64f2] text-white' : 'hover:bg-slate-100'}`}
                >
                  Visits
                </button>
              </div>
            </div>

            {/* Overdue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Task / Test</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Days Overdue</th>
                    <th className="pb-3 font-semibold">Assigned To</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                    <th className="pb-3 w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOverdue.map((task) => {
                    const initials = task.patientName
                      .split(' ')
                      .map(p => p[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    const patientDemo = 
                      task.patientName === 'Vikram Kumar' ? '60 yrs • Male' :
                      task.patientName === 'Nida Ali' ? '29 yrs • Female' :
                      task.patientName === 'Rohit Sharma' ? '48 yrs • Male' :
                      task.patientName === 'Ayesha Mariam' ? '37 yrs • Female' :
                      task.patientName === 'Sarah Khan' ? '23 yrs • Female' :
                      '45 yrs • Patient';

                    // Compute days overdue relative to demo date (13 Oct 2026)
                    const deadlineMs = new Date(task.deadline).getTime();
                    const refDateMs = new Date('2026-10-13').getTime();
                    const daysOverdue = Math.max(1, Math.round((refDateMs - deadlineMs) / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-[#0f172a] block">{task.patientName}</span>
                              <span className="text-[11px] text-slate-400">{patientDemo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 font-medium text-slate-800">
                          {task.title}
                        </td>
                        <td className="py-3.5 pr-2 text-slate-600 font-medium">
                          {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fee2e2] text-[#dc2626]">
                            {daysOverdue} days
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-slate-600 font-medium capitalize">
                          {task.assignedRole}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              if (onNotifyPatient) onNotifyPatient(task);
                              else onOpenTaskDetails(task);
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-[#1b64f2] text-[#1b64f2] bg-white hover:bg-blue-50 font-semibold text-xs transition-colors"
                          >
                            {task.patientName.includes('Rohit') ? 'Contact Patient' : 'Notify Patient'}
                          </button>
                        </td>
                        <td className="py-3.5 text-right pl-1 relative">
                          <button
                            onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeMenuTaskId === task.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-xs">
                              <button
                                onClick={() => {
                                  onOpenTaskDetails(task);
                                  setActiveMenuTaskId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  if (onNotifyPatient) onNotifyPatient(task);
                                  setActiveMenuTaskId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                              >
                                Send Alert
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Waiting for Doctor Review Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#1b64f2] shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                    Waiting for Doctor Review
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    These reports are verified and waiting for doctor&apos;s review.
                  </p>
                </div>
              </div>
              <button className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Test / Report</th>
                    <th className="pb-3 font-semibold">Verified On</th>
                    <th className="pb-3 font-semibold">Days Waiting</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingForDoctorTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No reports currently waiting for doctor review.
                      </td>
                    </tr>
                  ) : (
                    waitingForDoctorTasks.map((task) => {
                      const initials = task.patientName
                        .split(' ')
                        .map(p => p[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      const verifiedDate = task.report?.verifiedAt
                        ? new Date(task.report.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '11 Oct 2026';

                      const verifiedTime = task.report?.verifiedAt ? new Date(task.report.verifiedAt).getTime() : new Date('2026-10-11').getTime();
                      const refTime = new Date('2026-10-13').getTime();
                      const daysWaiting = Math.max(1, Math.round((refTime - verifiedTime) / (1000 * 60 * 60 * 24)));

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {initials}
                              </div>
                              <span className="font-bold text-[#0f172a]">{task.patientName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-2 font-medium text-slate-800">
                            {task.title}
                          </td>
                          <td className="py-3.5 pr-2 text-slate-600 font-medium">{verifiedDate}</td>
                          <td className="py-3.5 pr-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#d97706]">
                              {daysWaiting} day{daysWaiting > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => {
                                if (onNotifyDoctor) onNotifyDoctor(task);
                                else onOpenReview(task);
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-[#1b64f2] text-[#1b64f2] bg-white hover:bg-blue-50 font-semibold text-xs transition-colors"
                            >
                              Notify Doctor
                            </button>
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

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Reports to Verify + Recent Activity */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Reports to Verify Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#1b64f2]" />
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Reports to Verify
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Review extracted information and confirm accuracy.
                  </p>
                </div>
              </div>
              <button className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1 shrink-0">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 font-semibold">Patient</th>
                    <th className="pb-3 font-semibold">Test / Report</th>
                    <th className="pb-3 font-semibold">Uploaded On</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifyTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        All submitted reports have been verified.
                      </td>
                    </tr>
                  ) : (
                    verifyTasks.map((task) => {
                      const initials = task.patientName
                        .split(' ')
                        .map(p => p[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      const uploadDate = task.report?.uploadedAt
                        ? new Date(task.report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '12 Oct 2026';

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {initials}
                              </div>
                              <span className="font-bold text-[#0f172a]">{task.patientName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-2 font-medium text-slate-800">
                            {task.title}
                          </td>
                          <td className="py-3.5 pr-2 text-slate-600 font-medium">{uploadDate}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => onOpenVerify(task)}
                              className="px-4 py-1.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Recent Activity */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#1b64f2]" />
                <h3 className="text-base font-bold text-[#0f172a]">
                  Recent Activity
                </h3>
              </div>
              <button className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 text-xs">
              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Report verified</span>
                  <span className="text-[11px] text-slate-400 shrink-0">2 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sarah Khan - HbA1c Report
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">New report uploaded</span>
                  <span className="text-[11px] text-slate-400 shrink-0">4 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rahul Prasad - Lipid Profile
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-1 ring-amber-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Task marked overdue</span>
                  <span className="text-[11px] text-slate-400 shrink-0">6 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vikram Kumar - Blood Test
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Report verified</span>
                  <span className="text-[11px] text-slate-400 shrink-0">8 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ayesha Mariam - CBC Report
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Care plan created</span>
                  <span className="text-[11px] text-slate-400 shrink-0">1 day ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Danish Khan - Follow-up Appointment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
