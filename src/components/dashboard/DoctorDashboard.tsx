import React, { useState } from 'react';
import { CarePlan, CareTask, Patient, User, TaskType, PatientFeedback } from '../../types';
import { DoctorFeedbackQueue } from '../feedback/DoctorFeedbackQueue';
import { 
  FileText, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  PlusCircle, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';

interface DoctorDashboardProps {
  doctor: User;
  patients: Patient[];
  carePlans: CarePlan[];
  tasks: CareTask[];
  feedbacks?: PatientFeedback[];
  onOpenCreatePlan?: () => void;
  onOpenReview: (task: CareTask) => void;
  onOpenFeedbackReview?: (feedback: PatientFeedback) => void;
  onOpenTaskDetails: (task: CareTask) => void;
  onSelectPatient: (patientId: string) => void;
  onCreateCarePlan?: (data: {
    patientId: string;
    doctorId: string;
    title: string;
    diagnosis: string;
    taskTitle: string;
    taskType: TaskType;
    deadlineDays: number;
    fastingRequired: boolean;
    partnerFacility: string;
    instructions: string;
  }) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  patients,
  carePlans,
  tasks,
  feedbacks = [],
  onOpenCreatePlan,
  onOpenReview,
  onOpenFeedbackReview,
  onOpenTaskDetails,
  onSelectPatient,
  onCreateCarePlan
}) => {
  // Inline Care Plan Form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Filter tasks verified awaiting doctor review (must NOT be resolved!)
  const reportsToReview = tasks.filter(t => 
    (t.taskStatus === 'Verified' || (t.report && t.report.verificationStatus === 'Verified')) && 
    t.taskStatus !== 'Resolved'
  );
  // Overdue follow-ups
  const overdueTasks = tasks.filter(t => t.taskStatus === 'Overdue');
  // Active care plans count
  const activeCarePlansCount = carePlans.filter(cp => cp.status === 'Active').length || carePlans.length;
  // Completed tasks count
  const completedThisMonthCount = tasks.filter(t => t.taskStatus === 'Resolved').length;

  // Follow-up tasks for patients needing doctor monitoring (pending, overdue, or active visits)
  const followUpTasks = tasks
    .filter(t => t.taskStatus !== 'Resolved' && t.taskStatus !== 'Verified')
    .sort((a, b) => {
      if (a.taskStatus === 'Overdue' && b.taskStatus !== 'Overdue') return -1;
      if (b.taskStatus === 'Overdue' && a.taskStatus !== 'Overdue') return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // Handle inline care plan submission
  const handleInlineCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedTest) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    let deadlineDays = 7;
    if (dueDate) {
      const diffDays = Math.round((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      deadlineDays = Math.max(1, diffDays);
    }

    if (onCreateCarePlan) {
      onCreateCarePlan({
        patientId: patient.id,
        doctorId: doctor.id,
        title: `${selectedTest} Protocol`,
        diagnosis: patient.primaryDiagnosis || 'Clinical Follow-up',
        taskTitle: selectedTest,
        taskType: selectedTest.includes('X-ray') || selectedTest.includes('Ultrasound') ? 'Imaging' : 'Lab Test',
        deadlineDays,
        fastingRequired: selectedTest.toLowerCase().includes('fasting') || selectedTest.toLowerCase().includes('lipid'),
        partnerFacility: 'MetroCare Diagnostic Laboratory',
        instructions: instructions || 'Follow clinic instructions.'
      });
      setSelectedPatientId('');
      setSelectedTest('');
      setDueDate('');
      setInstructions('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3500);
    } else if (onOpenCreatePlan) {
      onOpenCreatePlan();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Good Morning Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#dff1ff] via-[#e7f5ff] to-[#d8effe] p-6 sm:p-8 border border-sky-100/60 shadow-2xs">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/40 blur-2xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 -mb-10 w-48 h-48 rounded-full bg-sky-200/30 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a] flex items-center gap-2">
              <span>Good Morning, Dr. Mehta</span>
              <span className="text-2xl">☀️</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Here&apos;s what needs your attention today.
            </p>
          </div>

          {/* Doctor Illustration & Speech Card */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Doctor Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-200 to-blue-100 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80"
                  alt="Dr. Arjun Mehta"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quote Speech Bubble */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-white/80 shadow-xs flex items-center gap-3 max-w-[220px]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#1b64f2] shadow-2xs">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#1e293b] leading-snug">
                &ldquo;Timely follow-up leads to better patient outcomes.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Reports to Review */}
        <div className="rounded-2xl border border-rose-100 bg-[#fef2f2] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {reportsToReview.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Reports to Review
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-rose-400 shrink-0" />
        </div>

        {/* Card 2: Overdue Follow-ups */}
        <div className="rounded-2xl border border-amber-100 bg-[#fffdf0] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {overdueTasks.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Overdue Follow-ups
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
        </div>

        {/* Card 3: Active Care Plans */}
        <div className="rounded-2xl border border-blue-100 bg-[#eff6ff] p-4 sm:p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1b64f2]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-[#0f172a] block leading-none">
                {activeCarePlansCount}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Active Care Plans
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
                {completedThisMonthCount}
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
        {/* LEFT COLUMN: Feedback Review Queue + Reports + Follow-Ups */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Closed-Loop Patient Feedback Review Queue (Core Requirement 6) */}
          <DoctorFeedbackQueue
            feedbacks={feedbacks}
            onOpenReview={(fb) => {
              if (onOpenFeedbackReview) onOpenFeedbackReview(fb);
            }}
          />

          {/* Card: Reports to Review Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#1b64f2]" />
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                  Reports to Review
                </h3>
              </div>
              <button
                onClick={onOpenCreatePlan}
                className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1"
              >
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
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportsToReview.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No pending reports to review. All verified reports have been signed off.
                      </td>
                    </tr>
                  ) : (
                    reportsToReview.map((t) => {
                      const p = patients.find(patient => patient.id === t.patientId);
                      const initials = (p?.fullName || t.patientName)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                      const demographic = p ? `${p.age} yrs • ${p.gender}` : 'Patient';
                      const uploadDate = t.report?.uploadedAt
                        ? new Date(t.report.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '10 Oct 2026';

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-[#0f172a] block">{t.patientName}</span>
                                <span className="text-[11px] text-slate-400">{demographic}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-2">
                            <span className="font-semibold text-[#0f172a] block">{t.title}</span>
                            <span className="text-[11px] text-slate-400">{t.partnerFacility || 'MetroCare Lab'}</span>
                          </td>
                          <td className="py-3.5 pr-2 text-slate-600 font-medium">{uploadDate}</td>
                          <td className="py-3.5 pr-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#15803d]">
                              Verified
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => onOpenReview(t)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                            >
                              Review Report
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

          {/* Card: Patients to Follow Up Table */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#1b64f2]" />
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                  Patients to Follow Up
                </h3>
              </div>
              <button
                onClick={() => {
                  const p = patients.find(item => item.id === 'patient-2');
                  if (p) onSelectPatient(p.id);
                }}
                className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1"
              >
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
                    <th className="pb-3 font-semibold">Next Step</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followUpTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No patients currently requiring follow-up.
                      </td>
                    </tr>
                  ) : (
                    followUpTasks.slice(0, 10).map((t) => {
                      const p = patients.find(patient => patient.id === t.patientId);
                      const initials = (p?.fullName || t.patientName)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                      const demographic = p ? `${p.age} yrs • ${p.gender}` : 'Patient';
                      const formattedDueDate = new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-[#0f172a] block">{t.patientName}</span>
                                <span className="text-[11px] text-slate-400">{demographic}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-2 font-medium text-slate-800">
                            {t.title}
                          </td>
                          <td className="py-3.5 pr-2 text-slate-600 font-medium">{formattedDueDate}</td>
                          <td className="py-3.5 pr-2">
                            {t.taskStatus === 'Overdue' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#dc2626]">
                                Overdue
                              </span>
                            ) : t.taskStatus === 'In Progress' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309]">
                                In Progress
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => onOpenTaskDetails(t)}
                              className="px-3.5 py-1.5 rounded-xl border border-[#1b64f2] text-[#1b64f2] bg-white hover:bg-blue-50 font-semibold text-xs transition-colors"
                            >
                              View Patient
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
        {/* RIGHT COLUMN: Create Care Plan + Schedule + Activity */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Card: Create New Care Plan */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-[#1b64f2]" />
              <h3 className="text-base font-bold text-[#0f172a]">
                Create New Care Plan
              </h3>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                Care plan created successfully! Added to patient queue.
              </div>
            )}

            <form onSubmit={handleInlineCreate} className="space-y-3.5 text-xs">
              {/* Select Patient */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Patient
                </label>
                <div className="relative">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:border-[#1b64f2] focus:outline-hidden focus:ring-1 focus:ring-[#1b64f2]"
                  >
                    <option value="">Search patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.age}y, {p.gender})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Test / Referral */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test / Referral
                </label>
                <div className="relative">
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    required
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:border-[#1b64f2] focus:outline-hidden focus:ring-1 focus:ring-[#1b64f2]"
                  >
                    <option value="">Select test or referral...</option>
                    <option value="Blood Test (HbA1c)">Blood Test (HbA1c)</option>
                    <option value="Fasting Lipid Profile">Fasting Lipid Profile</option>
                    <option value="Chest X-ray">Chest X-ray</option>
                    <option value="Thyroid Function Test">Thyroid Function Test</option>
                    <option value="Pelvic Ultrasound">Pelvic Ultrasound</option>
                    <option value="Cardiology Referral">Cardiology Referral</option>
                    <option value="Medication Review">Medication Review</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#1b64f2] focus:outline-hidden focus:ring-1 focus:ring-[#1b64f2]"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Eg. Fasting required for 8 hrs"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#1b64f2] focus:outline-hidden focus:ring-1 focus:ring-[#1b64f2] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1b64f2] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
              >
                Create Care Plan
              </button>
            </form>
          </div>

          {/* 2. Card: Today's Schedule */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#1b64f2]" />
                <h3 className="text-base font-bold text-[#0f172a]">
                  Today&apos;s Schedule
                </h3>
              </div>
              <button className="text-[#1b64f2] text-xs font-semibold hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800 shrink-0">10:00 AM</span>
                <div className="text-right">
                  <span className="font-bold text-[#0f172a] block">Priya Nair</span>
                  <span className="text-[11px] text-slate-400">Follow-up Consultation</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800 shrink-0">11:30 AM</span>
                <div className="text-right">
                  <span className="font-bold text-[#0f172a] block">Sameer Iqbal</span>
                  <span className="text-[11px] text-slate-400">Report Discussion</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800 shrink-0">02:00 PM</span>
                <div className="text-right">
                  <span className="font-bold text-[#0f172a] block">Ayesha Mariam</span>
                  <span className="text-[11px] text-slate-400">New Consultation</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800 shrink-0">04:00 PM</span>
                <div className="text-right">
                  <span className="font-bold text-[#0f172a] block">Rahul Prasad</span>
                  <span className="text-[11px] text-slate-400">Follow-up (Lab Results)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Card: Recent Activity */}
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

            {/* Timeline items */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 text-xs">
              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Lab report verified</span>
                  <span className="text-[11px] text-slate-400 shrink-0">2 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sarah Khan - HbA1c
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
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Care plan created</span>
                  <span className="text-[11px] text-slate-400 shrink-0">6 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nida Ali - Ultrasound
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Task marked overdue</span>
                  <span className="text-[11px] text-slate-400 shrink-0">8 hours ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vikram Kumar - Follow-up
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-[#1b64f2] border-2 border-white ring-1 ring-blue-200" />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#0f172a]">Patient report verified</span>
                  <span className="text-[11px] text-slate-400 shrink-0">1 day ago</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Danish Khan - Chest X-ray
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
