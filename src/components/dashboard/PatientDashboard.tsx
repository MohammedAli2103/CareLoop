import React, { useState } from 'react';
import { Patient, CareTask } from '../../types';
import { 
  Calendar, 
  MapPin, 
  UploadCloud, 
  FileText, 
  HelpCircle, 
  ChevronRight, 
  ListFilter, 
  Clock, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Heart
} from 'lucide-react';

interface PatientDashboardProps {
  patient: Patient;
  tasks: CareTask[];
  onOpenTaskDetails: (task: CareTask) => void;
  onOpenUpload: (task: CareTask) => void;
  onOpenHelpModal: (task: CareTask) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  tasks,
  onOpenTaskDetails,
  onOpenUpload,
  onOpenHelpModal
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Identify the Next Step Task
  // Prioritize: 1. Overdue task, 2. task-sk-1 if not resolved, 3. In Progress (report submitted), 4. Verified (awaiting doctor), 5. Pending, 6. First task
  const overdueTask = tasks.find(t => t.taskStatus === 'Overdue');
  const primaryTask = overdueTask 
    || tasks.find(t => t.id === 'task-sk-1' && t.taskStatus !== 'Resolved')
    || tasks.find(t => t.taskStatus === 'In Progress')
    || tasks.find(t => t.taskStatus === 'Verified')
    || tasks.find(t => t.taskStatus === 'Pending')
    || tasks.find(t => t.id === 'task-sk-1')
    || tasks[0];
  const isOverdue = tasks.some(t => t.taskStatus === 'Overdue');

  // Filter tasks list
  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'todo') return t.taskStatus !== 'Resolved';
    if (filter === 'completed') return t.taskStatus === 'Resolved';
    return true;
  });

  const getTaskIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('blood') || lower.includes('hba1c')) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
          <Activity className="h-5 w-5" />
        </div>
      );
    }
    if (lower.includes('x-ray') || lower.includes('chest') || lower.includes('imaging')) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Activity className="h-5 w-5" />
        </div>
      );
    }
    if (lower.includes('follow-up') || lower.includes('appointment')) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Stethoscope className="h-5 w-5" />
        </div>
      );
    }
    if (lower.includes('consult') || lower.includes('specialist')) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <Heart className="h-5 w-5" />
      </div>
    );
  };

  const getStatusBadge = (task: CareTask) => {
    if (task.taskStatus === 'Resolved') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#15803d]">
          Completed
        </span>
      );
    }
    if (task.taskStatus === 'In Progress') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0369a1]">
          Report Submitted
        </span>
      );
    }
    if (task.taskStatus === 'Verified') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#ccfbf1] text-[#0f766e]">
          Under Review
        </span>
      );
    }
    if (task.taskStatus === 'Overdue') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">
          Overdue
        </span>
      );
    }
    if (task.taskType === 'Follow-Up Visit') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0369a1]">
          Scheduled
        </span>
      );
    }
    if (task.taskType === 'Specialist Referral') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b]">
          Not Started
        </span>
      );
    }
    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309]">
        To Do
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#dff1ff] via-[#e7f5ff] to-[#d8effe] p-6 sm:p-8 border border-sky-100/60 shadow-2xs">
        {/* Subtle decorative leaf shapes */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/40 blur-2xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 -mb-10 w-48 h-48 rounded-full bg-sky-200/30 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] flex items-center gap-2">
              <span>Hello, {patient.fullName.split(' ')[0]}</span>
              <span className="text-2xl">👋</span>
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#1e293b]">
              Here&apos;s your care plan and next steps.
            </p>
            <p className="text-sm text-slate-500 font-medium">
              We&apos;ll keep you updated and help you stay on track.
            </p>
          </div>

          {/* Banner Graphic & Speech Bubble */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Sarah Khan Illustration */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-200 to-rose-100 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80"
                  alt="Sarah Khan"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Speech Bubble Card */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-white/80 shadow-xs flex items-center gap-3 max-w-[210px]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-2xs">
                <Heart className="h-4 w-4 fill-white" />
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#1e293b] leading-snug">
                You&apos;re taking an important step towards better health!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Task Alert if present */}
      {isOverdue && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Task Past Due Date</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                One or more tests in your care plan require immediate attention. Please upload your report or notify your coordinator.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {primaryTask && (
              <button
                onClick={() => onOpenUpload(primaryTask)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
              >
                Upload Overdue Report
              </button>
            )}
            {primaryTask && (
              <button
                onClick={() => onOpenHelpModal(primaryTask)}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl border border-rose-300 transition-colors"
              >
                Need Help?
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Your Next Step + All Your Tasks */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Your Next Step */}
          {primaryTask && (
            <div className="rounded-3xl border border-amber-200/90 bg-[#fffdf8] p-6 shadow-2xs">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-600 mt-0.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                    Your Next Step
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    This is the most important task right now.
                  </p>
                </div>
              </div>

              {/* Inner White Task Box */}
              <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#e11d48]">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#0f172a]">
                        {primaryTask.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {primaryTask.taskStatus === 'In Progress'
                          ? 'Report uploaded. Clinic coordinator (Nida Ali) is verifying the extracted values.'
                          : primaryTask.taskStatus === 'Verified'
                          ? 'Verified by care coordinator. Awaiting review by Dr. Arjun Mehta.'
                          : primaryTask.taskStatus === 'Resolved'
                          ? 'Doctor reviewed and signed off. Diagnostic care loop completed.'
                          : (primaryTask.instructions.split('.')[0] || 'Check your average blood sugar level.')}
                      </p>
                    </div>
                  </div>

                  {primaryTask.taskStatus === 'Resolved' ? (
                    <span className="shrink-0 px-3.5 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d]">
                      Completed
                    </span>
                  ) : primaryTask.taskStatus === 'In Progress' ? (
                    <span className="shrink-0 px-3.5 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0369a1]">
                      Report Submitted
                    </span>
                  ) : primaryTask.taskStatus === 'Verified' ? (
                    <span className="shrink-0 px-3.5 py-1 rounded-full text-xs font-bold bg-[#ccfbf1] text-[#0f766e]">
                      Under Review
                    </span>
                  ) : primaryTask.taskStatus === 'Overdue' ? (
                    <span className="shrink-0 px-3.5 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#dc2626]">
                      Overdue
                    </span>
                  ) : (
                    <span className="shrink-0 px-3.5 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#b45309]">
                      To Do
                    </span>
                  )}
                </div>

                {/* Date & Location */}
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Due Date: <strong>{new Date(primaryTask.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </span>
                    {primaryTask.taskStatus === 'Resolved' ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        (completed)
                      </span>
                    ) : primaryTask.taskStatus === 'Overdue' ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        (overdue)
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {(() => {
                          const target = new Date(primaryTask.deadline);
                          const now = new Date('2026-10-17');
                          const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          if (diff < 0) return `(${Math.abs(diff)} days past due)`;
                          if (diff === 0) return '(due today)';
                          return `(in ${diff} days)`;
                        })()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{primaryTask.partnerFacility || 'MetroCare Laboratory, Main Branch'}</span>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => onOpenTaskDetails(primaryTask)}
                      className="text-[#1b64f2] hover:underline font-semibold"
                    >
                      View Address
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {primaryTask.taskStatus === 'Pending' || primaryTask.taskStatus === 'Overdue' ? (
                    <>
                      <button
                        onClick={() => onOpenUpload(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Report</span>
                      </button>

                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50/60 text-[#1b64f2] border border-[#1b64f2] font-semibold text-xs sm:text-sm transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Instructions</span>
                      </button>
                    </>
                  ) : primaryTask.taskStatus === 'In Progress' ? (
                    <>
                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Verification Status</span>
                      </button>

                      <button
                        onClick={() => onOpenUpload(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50/60 text-[#1b64f2] border border-[#1b64f2] font-semibold text-xs sm:text-sm transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Re-upload Report</span>
                      </button>
                    </>
                  ) : primaryTask.taskStatus === 'Verified' ? (
                    <>
                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Verified Findings</span>
                      </button>

                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50/60 text-teal-700 border border-teal-300 font-semibold text-xs sm:text-sm transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Awaiting Doctor Review</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Doctor Review</span>
                      </button>

                      <button
                        onClick={() => onOpenTaskDetails(primaryTask)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold text-xs sm:text-sm transition-colors"
                      >
                        <span>Care Loop Completed</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card: All Your Tasks */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ListFilter className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                    All Your Tasks
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Here are all the tests and appointments in your care plan.
                  </p>
                </div>
              </div>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
                >
                  <span>{filter === 'all' ? 'All Tasks' : filter === 'todo' ? 'To Do' : 'Completed'}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-20 text-xs">
                    <button
                      onClick={() => { setFilter('all'); setIsFilterOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      All Tasks
                    </button>
                    <button
                      onClick={() => { setFilter('todo'); setIsFilterOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      To Do
                    </button>
                    <button
                      onClick={() => { setFilter('completed'); setIsFilterOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Completed
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskDetails(t)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {getTaskIcon(t.title)}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#0f172a] truncate group-hover:text-[#1b64f2] transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Due: {new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(t)}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Progress + Need Help + Recent Activity */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Card: Your Care Plan Progress */}
          {(() => {
            const totalTasks = tasks.length || 5;
            const completedTasks = tasks.filter(t => t.taskStatus === 'Resolved').length;
            const progressPercent = Math.round((completedTasks / totalTasks) * 100);

            return (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ff] text-[#1b64f2]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Your Care Plan Progress
                  </h3>
                </div>

                <div className="flex items-center gap-6">
                  {/* Radial Progress Ring */}
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background track */}
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Progress arc */}
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-extrabold text-[#0f172a]">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#0f172a]">
                      {completedTasks} of {totalTasks} steps completed
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {progressPercent === 100
                        ? "All care plan tasks are completed! Excellent work."
                        : progressPercent >= 50
                        ? "Great progress! Over halfway through your care plan."
                        : "Keep going! You're making good progress."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. Card: Need Help? */}
          <div className="rounded-3xl border border-blue-100 bg-[#f0f7ff] p-6 shadow-2xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1b64f2] mt-0.5">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">
                  Need Help?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Having trouble completing a test or appointment?
                </p>
              </div>
            </div>

            {/* Quick action reason pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'Too expensive',
                'Too far from location',
                'Scheduling issue',
                'Feeling anxious',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    if (primaryTask) onOpenHelpModal(primaryTask);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1e293b] bg-white hover:bg-blue-50 border border-slate-200/90 shadow-2xs transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Card: Recent Activity */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#1b64f2]" />
              <h3 className="text-base font-bold text-[#0f172a]">
                Recent Activity
              </h3>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Event 1: Recent dynamic events */}
              {tasks.filter(t => t.doctorReview).map(t => (
                <div key={`rev-${t.id}`} className="relative">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200 flex items-center justify-center" />
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#0f172a]">
                      {t.title} Reviewed
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(t.doctorReview!.reviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dr. Mehta reviewed findings: &quot;{t.doctorReview!.nextActionRequired}&quot;
                  </p>
                </div>
              ))}

              {tasks.filter(t => t.report?.verificationStatus === 'Verified' && !t.doctorReview).map(t => (
                <div key={`ver-${t.id}`} className="relative">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white ring-1 ring-teal-200 flex items-center justify-center" />
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#0f172a]">
                      {t.title} Verified
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(t.report!.verifiedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Care coordinator verified source lab values.
                  </p>
                </div>
              ))}

              {tasks.filter(t => t.report && t.report.verificationStatus === 'Unverified').map(t => (
                <div key={`up-${t.id}`} className="relative">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#0f172a]">
                      {t.title} Uploaded
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(t.report!.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    You uploaded the diagnostic report ({t.report!.fileName}).
                  </p>
                </div>
              ))}

              {/* Baseline historical events from reference UI */}
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200 flex items-center justify-center" />
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    X-ray Report Reviewed
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    12 Oct 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Doctor reviewed your chest X-ray report.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    X-ray Report Uploaded
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    10 Oct 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You uploaded the X-ray report.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    X-ray Test Completed
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    10 Oct 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test marked as completed.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-200" />
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    Care Plan Created
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    8 Oct 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Doctor created your care plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
