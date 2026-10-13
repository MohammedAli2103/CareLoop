import { useState } from 'react';
import { useCareLoop } from './hooks/useCareLoop';
import { UserRole, CareTask, TestResult, NextAction, DelayReason, TaskType } from './types';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { DemoRoleBanner } from './components/layout/DemoRoleBanner';
import { PatientDashboard } from './components/dashboard/PatientDashboard';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { CoordinatorDashboard } from './components/dashboard/CoordinatorDashboard';
import { CarePlanTimeline } from './components/care-plans/CarePlanTimeline';
import { ReportUploadModal } from './components/reports/ReportUploadModal';
import { SplitScreenVerificationModal } from './components/reports/SplitScreenVerificationModal';
import { DoctorReviewModal } from './components/reports/DoctorReviewModal';
import { CareTaskDetailModal } from './components/care-tasks/CareTaskDetailModal';
import { PatientHelpModal } from './components/care-tasks/PatientHelpModal';
import { CarePlanCreateModal } from './components/care-plans/CarePlanCreateModal';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { SimulatedWhatsAppModal } from './components/notifications/SimulatedWhatsAppModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { StatusBadge } from './components/ui/StatusBadge';
import { PlusCircle, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('patient');
  const [activePatientId, setActivePatientId] = useState<string>('patient-1');
  const [activeTab, setActiveTab] = useState<string>('patient-home');
  
  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Modals state
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<CareTask | null>(null);
  const [selectedTaskForUpload, setSelectedTaskForUpload] = useState<CareTask | null>(null);
  const [selectedTaskForHelp, setSelectedTaskForHelp] = useState<CareTask | null>(null);
  const [selectedTaskForVerify, setSelectedTaskForVerify] = useState<CareTask | null>(null);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<CareTask | null>(null);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'info' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Reactive data hook
  const {
    currentUser,
    patients,
    currentPatient,
    carePlans,
    allTasks,
    roleTasks,
    notifications,
    service
  } = useCareLoop(activeRole, activePatientId);

  // Synchronize role switch with proper default navigation tab
  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (newRole === 'patient') {
      setActiveTab('patient-home');
      addToast('info', 'Switched to Patient View', `Logged in as ${currentPatient.fullName}`);
    } else if (newRole === 'doctor') {
      setActiveTab('doctor-dashboard');
      addToast('info', 'Switched to Doctor View', 'Logged in as Dr. Arjun Mehta, MD');
    } else {
      setActiveTab('coord-dashboard');
      addToast('info', 'Switched to Coordinator View', 'Logged in as Nida Ali (Care Coordinator)');
    }
  };

  // --- ACTIONS ---

  const handleCreatePlan = (data: {
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
  }) => {
    const result = service.createCarePlan(data);
    if (result && result.task && result.carePlan) {
      addToast(
        'success',
        'Care Plan Created',
        `Order "${result.task.title}" created with due date in ${data.deadlineDays} days.`
      );
    } else {
      addToast('error', 'Care Plan Creation Failed', 'Could not create care plan.');
    }
  };

  const handleUploadSuccess = (taskId: string, fileName: string, fileSize: string) => {
    const updated = service.uploadReport(taskId, {
      fileName,
      fileSize,
      fileType: 'application/pdf'
    });
    if (updated) {
      addToast(
        'success',
        'Report Submitted',
        `File "${fileName}" received. Clinic coordinator notified to check values.`
      );
    } else {
      addToast('error', 'Upload Failed', 'Could not locate diagnostic task.');
    }
  };

  const handleVerifySuccess = (taskId: string, results: TestResult[], notes: string) => {
    const updated = service.verifyReport(taskId, results, notes);
    if (updated) {
      addToast(
        'success',
        'Report Verified',
        `Checked report routed to ${updated.doctorName} for physician review.`
      );
    } else {
      addToast('error', 'Verification Failed', 'Could not record report verification.');
    }
  };

  const handleFlagReport = (taskId: string, reason: string) => {
    const updated = service.flagReportForCorrection(taskId, reason);
    if (updated) {
      addToast(
        'warning',
        'Report Flagged',
        `Re-upload requested from patient: "${reason}".`
      );
    } else {
      addToast('error', 'Action Failed', 'Could not flag report.');
    }
  };

  const handleCompleteDoctorReview = (taskId: string, data: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }) => {
    const updated = service.completeDoctorReview(taskId, data);
    if (updated) {
      addToast(
        'success',
        'Review Completed',
        `Clinical sign-off recorded. Next step: "${data.nextAction}".`
      );
    } else {
      addToast('error', 'Review Failed', 'Could not record physician clinical review.');
    }
  };

  const handleRecordDelayReason = (taskId: string, reason: DelayReason, notes: string) => {
    const updated = service.recordDelayReason(taskId, reason, notes);
    if (updated) {
      addToast(
        'info',
        'Help Note Sent',
        `Coordinator Nida Ali has been notified about your ${reason.toLowerCase()} difficulty.`
      );
    } else {
      addToast('error', 'Help Note Failed', 'Could not record delay reason.');
    }
  };

  const handleSimulateTimeLeap = () => {
    service.simulateTimeLeap();
    addToast(
      'warning',
      'Overdue Task Simulated',
      'Test deadline passed without report. Task escalated to Coordinator Overdue Queue.'
    );
    if (activeRole !== 'coordinator') {
      setActiveRole('coordinator');
      setActiveTab('coord-dashboard');
    }
  };

  const handleReassignTask = (taskId: string, role: UserRole, notes: string) => {
    const updated = service.reassignEscalatedTask(taskId, role, notes);
    if (updated) {
      addToast(
        'success',
        'Task Reassigned',
        `Task reassigned to ${role}.`
      );
    } else {
      addToast('error', 'Reassignment Failed', 'Could not reassign task.');
    }
  };

  const handleResetData = () => {
    service.resetDemoData();
    addToast('info', 'Demo Data Reset', 'All tasks, care plans, and records restored to clean demo state.');
  };

  const handleNotifyDoctor = (task: CareTask) => {
    const success = service.sendReminderToDoctor(task.id);
    if (success) {
      addToast('success', 'Reminder Sent', `Notification dispatched to ${task.doctorName} for ${task.patientName}'s report.`);
    } else {
      addToast('error', 'Reminder Failed', `Could not dispatch notification to doctor.`);
    }
  };

  const handleNotifyPatient = (task: CareTask) => {
    const success = service.sendReminderToPatient(task.id);
    if (success) {
      addToast('success', 'Patient Alert Sent', `Safety-net notification sent to ${task.patientName} for overdue ${task.title}.`);
    } else {
      addToast('error', 'Alert Failed', `Could not dispatch alert to patient.`);
    }
  };

  // Determine current page title matching the reference designs
  const getPageTitle = () => {
    switch (activeTab) {
      case 'patient-home': return 'Patient Dashboard';
      case 'patient-plan': return 'My Care Plan';
      case 'patient-reports': return 'My Reports';
      case 'doctor-dashboard': return 'Doctor Dashboard';
      case 'doctor-plans': return 'Care Plans';
      case 'doctor-patients': return 'Patients';
      case 'coord-dashboard': return 'Care Coordinator Dashboard';
      case 'coord-tasks': return 'All Care Tasks';
      case 'coord-verification': return 'Reports to Verify';
      default: return 'CareLoop';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Demo Banner with Role Switcher & Hackathon Triggers */}
      <DemoRoleBanner
        currentRole={activeRole}
        onRoleChange={handleRoleChange}
        onSimulateTimeLeap={handleSimulateTimeLeap}
        onResetData={handleResetData}
        onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <AppSidebar
          currentRole={activeRole}
          currentTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
          onOpenHelp={() => {
            const task = roleTasks[0];
            if (task) setSelectedTaskForHelp(task);
          }}
          unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Header */}
          <AppHeader
            currentRole={activeRole}
            currentUser={currentUser}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            pageTitle={getPageTitle()}
            onRoleChange={handleRoleChange}
            onSimulateTimeLeap={handleSimulateTimeLeap}
            onResetData={handleResetData}
            onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
          />

          {/* Body Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
            {/* ======================================================== */}
            {/* 1. PATIENT VIEWS */}
            {/* ======================================================== */}
            {activeRole === 'patient' && (
              <>
                {/* A. HOME */}
                {activeTab === 'patient-home' && (
                  <PatientDashboard
                    patient={currentPatient}
                    tasks={roleTasks}
                    onOpenTaskDetails={setSelectedTaskForDetails}
                    onOpenUpload={setSelectedTaskForUpload}
                    onOpenHelpModal={setSelectedTaskForHelp}
                  />
                )}

                {/* B. MY CARE PLAN */}
                {activeTab === 'patient-plan' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">My Care Plan</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Track the progress of each test ordered by your doctor
                      </p>
                    </div>

                    <div className="space-y-4">
                      {roleTasks.map(task => (
                        <CarePlanTimeline
                          key={task.id}
                          currentStatus={task.taskStatus}
                          taskTitle={task.title}
                          hasReport={!!task.report}
                          isVerified={task.report?.verificationStatus === 'Verified'}
                          isReviewed={task.taskStatus === 'Resolved'}
                          isEscalated={task.isEscalated}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* C. MY REPORTS */}
                {activeTab === 'patient-reports' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">My Reports</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        View submitted test reports and upload files
                      </p>
                    </div>

                    <div className="space-y-3">
                      {roleTasks.map(task => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{task.title}</span>
                              <StatusBadge status={task.taskStatus} size="sm" />
                            </div>
                            {task.report ? (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-teal-600" />
                                <span>Uploaded file: <strong>{task.report.fileName}</strong> ({task.report.fileSize})</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500">
                                No report uploaded yet. Due: {new Date(task.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(task.taskStatus === 'Pending' || task.taskStatus === 'Overdue') ? (
                              <button
                                onClick={() => setSelectedTaskForUpload(task)}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors"
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>Upload Report</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskForDetails(task)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* 2. DOCTOR VIEWS */}
            {/* ======================================================== */}
            {activeRole === 'doctor' && (
              <>
                {/* A. DASHBOARD */}
                {activeTab === 'doctor-dashboard' && (
                  <DoctorDashboard
                    doctor={currentUser}
                    patients={patients}
                    carePlans={carePlans}
                    tasks={allTasks}
                    onOpenCreatePlan={() => setIsCreatePlanModalOpen(true)}
                    onCreateCarePlan={handleCreatePlan}
                    onOpenReview={setSelectedTaskForReview}
                    onOpenTaskDetails={setSelectedTaskForDetails}
                    onSelectPatient={(pid) => {
                      setActivePatientId(pid);
                      setActiveRole('patient');
                      setActiveTab('patient-home');
                    }}
                  />
                )}

                {/* B. PATIENTS */}
                {activeTab === 'doctor-patients' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Patients</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Active patients and their diagnostic status
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                      {patients.map(p => {
                        const patientTasks = allTasks.filter(t => t.patientId === p.id);
                        const hasOverdue = patientTasks.some(t => t.taskStatus === 'Overdue');
                        const hasVerified = patientTasks.some(t => t.taskStatus === 'Verified');

                        return (
                          <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{p.fullName}</span>
                                <span className="text-xs text-slate-400 font-mono">({p.mrn})</span>
                                {hasOverdue && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    Overdue Task
                                  </span>
                                )}
                                {hasVerified && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                    Ready for Review
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {p.age}y {p.gender} • Condition: <strong>{p.primaryDiagnosis}</strong>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Phone: {p.phone} • {patientTasks.length} assigned test{patientTasks.length !== 1 ? 's' : ''}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setActivePatientId(p.id);
                                setActiveRole('patient');
                                setActiveTab('patient-home');
                              }}
                              className="px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shrink-0"
                            >
                              View as Patient
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* C. CARE PLANS */}
                {activeTab === 'doctor-plans' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Care Plans</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Diagnostic order bundles assigned to patients
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreatePlanModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-2xs transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ New Care Plan</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {carePlans.map(cp => {
                        const planTasks = allTasks.filter(t => t.carePlanId === cp.id);
                        return (
                          <div key={cp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">{cp.title}</span>
                              <StatusBadge status={cp.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-600">
                              Patient: <strong>{cp.patientName}</strong> • Condition: {cp.diagnosis}
                            </p>
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-semibold text-slate-500">
                                Ordered Tasks:
                              </span>
                              {planTasks.map(t => (
                                <div
                                  key={t.id}
                                  onClick={() => setSelectedTaskForDetails(t)}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                  <span className="font-medium text-slate-800">{t.title}</span>
                                  <StatusBadge status={t.taskStatus} size="sm" />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* 3. COORDINATOR VIEWS */}
            {/* ======================================================== */}
            {activeRole === 'coordinator' && (
              <>
                {/* A. DASHBOARD (3 Queues) */}
                {activeTab === 'coord-dashboard' && (
                  <CoordinatorDashboard
                    coordinator={currentUser}
                    tasks={allTasks}
                    onOpenTaskDetails={setSelectedTaskForDetails}
                    onOpenVerify={setSelectedTaskForVerify}
                    onOpenReview={setSelectedTaskForReview}
                    onSimulateTimeLeap={handleSimulateTimeLeap}
                    onNotifyDoctor={handleNotifyDoctor}
                    onNotifyPatient={handleNotifyPatient}
                  />
                )}

                {/* B. TASKS */}
                {activeTab === 'coord-tasks' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">All Care Tasks</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Complete hospital task registry and completion statuses
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                      {allTasks.map(task => (
                        <div
                          key={task.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{task.patientName}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs font-semibold text-slate-700">{task.title}</span>
                              <StatusBadge status={task.taskStatus} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500">
                              Due: {new Date(task.deadline).toLocaleDateString()} • Assigned: <span className="capitalize">{task.assignedRole}</span> • Doctor: {task.doctorName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {task.taskStatus === 'In Progress' && task.report && (
                              <button
                                onClick={() => setSelectedTaskForVerify(task)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
                              >
                                Verify Report
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTaskForDetails(task)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* C. REPORT VERIFICATION */}
                {activeTab === 'coord-verification' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Reports to Verify</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Lab reports uploaded by patients awaiting staff side-by-side checking
                      </p>
                    </div>

                    <div className="space-y-3">
                      {allTasks.filter(t => t.taskStatus === 'In Progress' && t.report).length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                          <span>All uploaded reports have been verified. No pending items!</span>
                        </div>
                      ) : (
                        allTasks.filter(t => t.taskStatus === 'In Progress' && t.report).map(task => (
                          <div
                            key={task.id}
                            className="bg-white rounded-xl border border-sky-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{task.patientName}</span>
                                <StatusBadge status="In Progress" size="sm" />
                              </div>
                              <p className="text-xs font-medium text-slate-800">{task.title}</p>
                              <p className="text-xs text-slate-500">
                                File: <span className="font-mono text-slate-700">{task.report?.fileName}</span> ({task.report?.fileSize})
                              </p>
                            </div>

                            <button
                              onClick={() => setSelectedTaskForVerify(task)}
                              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-2xs transition-colors shrink-0"
                            >
                              Verify Report Side-by-Side
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Report Upload Modal */}
      {selectedTaskForUpload && (
        <ReportUploadModal
          isOpen={true}
          onClose={() => setSelectedTaskForUpload(null)}
          task={selectedTaskForUpload}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* 2. Patient Help Modal */}
      {selectedTaskForHelp && (
        <PatientHelpModal
          isOpen={true}
          onClose={() => setSelectedTaskForHelp(null)}
          task={selectedTaskForHelp}
          onSubmitHelp={handleRecordDelayReason}
        />
      )}

      {/* 3. Split-Screen Verification Modal */}
      {selectedTaskForVerify && (
        <SplitScreenVerificationModal
          isOpen={true}
          onClose={() => setSelectedTaskForVerify(null)}
          task={selectedTaskForVerify}
          onVerify={handleVerifySuccess}
          onFlag={handleFlagReport}
        />
      )}

      {/* 4. Doctor Clinical Review Modal */}
      {selectedTaskForReview && (
        <DoctorReviewModal
          isOpen={true}
          onClose={() => setSelectedTaskForReview(null)}
          task={selectedTaskForReview}
          onCompleteReview={handleCompleteDoctorReview}
        />
      )}

      {/* 5. Care Task Detail & Timeline Modal */}
      {selectedTaskForDetails && (
        <CareTaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTaskForDetails(null)}
          task={selectedTaskForDetails}
          activeRole={activeRole}
          onRecordDelayReason={handleRecordDelayReason}
          onOpenUpload={setSelectedTaskForUpload}
          onOpenVerify={setSelectedTaskForVerify}
          onOpenReview={setSelectedTaskForReview}
          onReassignTask={handleReassignTask}
        />
      )}

      {/* 6. Create Care Plan Modal */}
      <CarePlanCreateModal
        isOpen={isCreatePlanModalOpen}
        onClose={() => setIsCreatePlanModalOpen(false)}
        patients={patients}
        onCreate={handleCreatePlan}
      />

      {/* 7. Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        notifications={notifications}
        activeRole={activeRole}
        onMarkRead={(id) => service.markNotificationRead(id)}
        onMarkAllRead={() => service.markAllNotificationsRead(activeRole)}
        onSelectTask={(taskId) => {
          const t = allTasks.find(item => item.id === taskId);
          if (t) setSelectedTaskForDetails(t);
        }}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
      />

      {/* 8. Simulated WhatsApp Preview Modal */}
      <SimulatedWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        patientName={currentPatient.fullName}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
