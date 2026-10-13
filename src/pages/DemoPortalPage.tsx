import { useState } from 'react';
import { useCareLoop } from '../hooks/useCareLoop';
import { UserRole, CareTask, TestResult, NextAction, DelayReason, TaskType, CarePlan, PatientFeedback, SubmitFeedbackPayload, ReviewFeedbackPayload } from '../types';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import { DemoRoleBanner } from '../components/layout/DemoRoleBanner';
import { PatientDashboard } from '../components/dashboard/PatientDashboard';
import { DoctorDashboard } from '../components/dashboard/DoctorDashboard';
import { CoordinatorDashboard } from '../components/dashboard/CoordinatorDashboard';
import { CarePlanTimeline } from '../components/care-plans/CarePlanTimeline';
import { ReportUploadModal } from '../components/reports/ReportUploadModal';
import { SplitScreenVerificationModal } from '../components/reports/SplitScreenVerificationModal';
import { DoctorReviewModal } from '../components/reports/DoctorReviewModal';
import { CareTaskDetailModal } from '../components/care-tasks/CareTaskDetailModal';
import { PatientHelpModal } from '../components/care-tasks/PatientHelpModal';
import { CarePlanCreateModal } from '../components/care-plans/CarePlanCreateModal';
import { PatientFeedbackModal } from '../components/feedback/PatientFeedbackModal';
import { FeedbackReviewModal } from '../components/feedback/FeedbackReviewModal';
import { NotificationsDrawer } from '../components/notifications/NotificationsDrawer';
import { SimulatedWhatsAppModal } from '../components/notifications/SimulatedWhatsAppModal';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PlusCircle, UploadCloud, FileText } from 'lucide-react';

export const DemoPortalPage = () => {
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
  const [selectedPlanForFeedback, setSelectedPlanForFeedback] = useState<CarePlan | null>(null);
  const [selectedFeedbackToView, setSelectedFeedbackToView] = useState<PatientFeedback | null>(null);
  const [selectedFeedbackForReview, setSelectedFeedbackForReview] = useState<PatientFeedback | null>(null);
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
    feedbacks,
    service
  } = useCareLoop(activeRole, activePatientId);

  const handleFeedbackSubmit = async (payload: SubmitFeedbackPayload) => {
    try {
      const res = await service.submitPatientFeedback(payload);
      if (res) {
        addToast(
          'success',
          'Care Feedback Recorded',
          'Your recovery experience and feedback have been sent to your doctor for review.'
        );
      }
      setSelectedPlanForFeedback(null);
    } catch (err: any) {
      addToast('error', 'Feedback Submission Issue', err?.message || 'Failed to submit feedback.');
      throw err;
    }
  };

  const handleFeedbackReview = async (feedbackId: string, data: ReviewFeedbackPayload) => {
    try {
      const res = await service.completeFeedbackReview(feedbackId, data, currentUser.id);
      if (res) {
        addToast(
          'success',
          'Feedback Evaluation Completed',
          `Closed loop for ${res.feedback.patientName}. Next action: "${data.nextAction}".`
        );
      }
      setSelectedFeedbackForReview(null);
    } catch (err: any) {
      addToast('error', 'Review Failed', err?.message || 'Failed to complete review.');
      throw err;
    }
  };

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

  const handleCreatePlan = async (data: {
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
    const result = await service.createCarePlan(data);
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

  const handleUploadSuccess = async (taskId: string, fileName: string, fileSize: string) => {
    const updated = await service.uploadReport(taskId, {
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

  const handleVerifySuccess = async (taskId: string, results: TestResult[], notes: string) => {
    const updated = await service.verifyReport(taskId, results, notes);
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

  const handleFlagReport = async (taskId: string, reason: string) => {
    const updated = await service.flagReportForCorrection(taskId, reason);
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

  const handleCompleteDoctorReview = async (taskId: string, data: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }) => {
    const updated = await service.completeDoctorReview(taskId, data);
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

  const handleRecordDelayReason = async (taskId: string, reason: DelayReason, notes: string) => {
    const updated = await service.recordDelayReason(taskId, reason, notes);
    if (updated) {
      addToast(
        'info',
        'Help Note Sent',
        `Reason "${reason}" logged. Assigned coordinator notified.`
      );
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

  const handleReassignTask = async (taskId: string, role: UserRole, notes: string) => {
    const updated = await service.reassignEscalatedTask(taskId, role, notes);
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
      addToast('warning', 'Safety Net Alert Dispatched', `Urgent overdue alert sent to ${task.patientName}.`);
    } else {
      addToast('error', 'Alert Failed', `Could not dispatch alert.`);
    }
  };

  // Page title generator based on current active view
  const getPageTitle = () => {
    if (activeRole === 'patient') {
      if (activeTab === 'patient-home') return 'My Care Journey';
      if (activeTab === 'patient-plan') return 'Care Plan Schedule';
      if (activeTab === 'patient-reports') return 'Diagnostic Reports';
      return 'Patient Dashboard';
    } else if (activeRole === 'doctor') {
      if (activeTab === 'doctor-dashboard') return 'Clinical Command Center';
      if (activeTab === 'doctor-patients') return 'Assigned Patients';
      if (activeTab === 'doctor-plans') return 'Active Care Plans';
      return 'Doctor Dashboard';
    } else {
      if (activeTab === 'coord-dashboard') return 'Safety-Net Radar Command';
      if (activeTab === 'coord-radar') return 'Overdue Safety Net';
      if (activeTab === 'coord-verification') return 'Document Audit Queue';
      if (activeTab === 'coord-log') return 'Audit & Compliance Log';
      return 'Care Coordinator Dashboard';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
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
            {/* 1. PATIENT VIEWS */}
            {activeRole === 'patient' && (
              <>
                {activeTab === 'patient-home' && (
                  <PatientDashboard
                    patient={currentPatient}
                    tasks={roleTasks}
                    carePlans={carePlans}
                    feedbacks={feedbacks}
                    onOpenTaskDetails={setSelectedTaskForDetails}
                    onOpenUpload={setSelectedTaskForUpload}
                    onOpenHelpModal={setSelectedTaskForHelp}
                    onOpenFeedbackModal={(cp) => {
                      setSelectedPlanForFeedback(cp);
                      setSelectedFeedbackToView(null);
                    }}
                    onViewFeedbackModal={(cp, fb) => {
                      setSelectedPlanForFeedback(cp);
                      setSelectedFeedbackToView(fb);
                    }}
                  />
                )}

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
                                <span>{task.report.fileName} ({task.report.fileSize})</span>
                                <span className="text-slate-400">• Uploaded {task.report.uploadedAt.split('T')[0]}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400">No report uploaded yet</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTaskForDetails(task)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                            >
                              Details
                            </button>
                            {!task.report && task.taskStatus !== 'Resolved' && (
                              <button
                                onClick={() => setSelectedTaskForUpload(task)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <UploadCloud className="w-3.5 h-3.5" /> Upload Report
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

            {/* 2. DOCTOR VIEWS */}
            {activeRole === 'doctor' && (
              <>
                {activeTab === 'doctor-dashboard' && (
                  <DoctorDashboard
                    doctor={currentUser}
                    patients={patients}
                    carePlans={carePlans}
                    tasks={allTasks}
                    feedbacks={feedbacks}
                    onOpenCreatePlan={() => setIsCreatePlanModalOpen(true)}
                    onOpenReview={setSelectedTaskForReview}
                    onOpenFeedbackReview={setSelectedFeedbackForReview}
                    onOpenTaskDetails={setSelectedTaskForDetails}
                    onSelectPatient={(pId) => {
                      setActivePatientId(pId);
                      setActiveRole('patient');
                      setActiveTab('patient-home');
                      addToast('info', 'Patient Selected', 'Viewing patient profile and clinical journey.');
                    }}
                    onCreateCarePlan={handleCreatePlan}
                  />
                )}

                {activeTab === 'doctor-patients' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">My Patients Panel</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Active patients enrolled in longitudinal care pathways
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {patients.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900">{p.fullName}</h3>
                              <p className="text-xs text-slate-500">{p.mrn} • {p.age}y, {p.gender}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1b64f2] text-[10px] font-bold border border-blue-200">
                              {p.bloodGroup || 'O+'}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                            <p className="font-medium text-slate-800 line-clamp-1">{p.primaryDiagnosis}</p>
                            <p className="text-slate-400 text-[11px]">{p.phone}</p>
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActivePatientId(p.id);
                                setActiveRole('patient');
                                setActiveTab('patient-home');
                                addToast('info', 'Switched View', `Viewing ${p.fullName}'s dashboard`);
                              }}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-blue-50 text-[#1b64f2] hover:bg-blue-100 text-xs font-semibold text-center transition-colors"
                            >
                              View Patient Journey
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'doctor-plans' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Active Care Plans</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Authored diagnostic and follow-up clinical plans
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreatePlanModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b64f2] text-white text-xs font-semibold hover:bg-blue-700 shadow-2xs transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" /> Author New Plan
                      </button>
                    </div>

                    <div className="space-y-4">
                      {carePlans.map(cp => {
                        const planTasks = allTasks.filter(t => t.carePlanId === cp.id);
                        const completedCount = planTasks.filter(t => t.taskStatus === 'Resolved').length;

                        return (
                          <div key={cp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-900 text-base">{cp.title}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cp.status === 'Active' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {cp.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Patient: <strong className="text-slate-700">{cp.patientName}</strong> • Diagnosis: {cp.diagnosis}
                                </p>
                              </div>
                              <div className="text-xs text-slate-500 sm:text-right">
                                <span className="block font-semibold text-slate-700">Target SLA: {cp.targetEndDate}</span>
                                <span className="text-[11px]">{completedCount} of {planTasks.length} orders closed</span>
                              </div>
                            </div>

                            {/* Orders inside plan */}
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Diagnostic Orders & SLA Gates
                              </span>
                              {planTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-xs">
                                  <div className="flex items-center gap-2.5">
                                    <StatusBadge status={task.taskStatus} size="sm" />
                                    <span className="font-semibold text-slate-800">{task.title}</span>
                                    <span className="text-slate-400 text-[11px]">• Due: {task.deadline}</span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedTaskForDetails(task)}
                                    className="text-[#1b64f2] hover:underline font-semibold"
                                  >
                                    View Detail
                                  </button>
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

            {/* 3. COORDINATOR VIEWS */}
            {activeRole === 'coordinator' && (
              <>
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
              </>
            )}
          </main>
        </div>
      </div>

      {/* --- SHARED MODALS --- */}

      {/* 1. Report Upload Modal */}
      {selectedTaskForUpload && (
        <ReportUploadModal
          isOpen={true}
          task={selectedTaskForUpload}
          onClose={() => setSelectedTaskForUpload(null)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* 2. Side-by-Side Verification Modal */}
      {selectedTaskForVerify && (
        <SplitScreenVerificationModal
          isOpen={true}
          task={selectedTaskForVerify}
          onClose={() => setSelectedTaskForVerify(null)}
          onVerify={handleVerifySuccess}
          onFlag={handleFlagReport}
        />
      )}

      {/* 3. Doctor Review Modal */}
      {selectedTaskForReview && (
        <DoctorReviewModal
          isOpen={true}
          task={selectedTaskForReview}
          onClose={() => setSelectedTaskForReview(null)}
          onCompleteReview={handleCompleteDoctorReview}
        />
      )}

      {/* 4. Task Detail Modal */}
      {selectedTaskForDetails && (
        <CareTaskDetailModal
          isOpen={true}
          task={selectedTaskForDetails}
          activeRole={activeRole}
          onClose={() => setSelectedTaskForDetails(null)}
          onRecordDelayReason={handleRecordDelayReason}
          onOpenUpload={setSelectedTaskForUpload}
          onOpenVerify={setSelectedTaskForVerify}
          onOpenReview={setSelectedTaskForReview}
          onReassignTask={handleReassignTask}
        />
      )}

      {/* 5. Patient Help & Delay Modal */}
      {selectedTaskForHelp && (
        <PatientHelpModal
          isOpen={true}
          task={selectedTaskForHelp}
          onClose={() => setSelectedTaskForHelp(null)}
          onSubmitHelp={handleRecordDelayReason}
        />
      )}

      {/* 6. Doctor Care Plan Creation Modal */}
      {isCreatePlanModalOpen && (
        <CarePlanCreateModal
          isOpen={true}
          onClose={() => setIsCreatePlanModalOpen(false)}
          patients={patients}
          onCreate={handleCreatePlan}
        />
      )}

      {/* 7. Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        notifications={notifications}
        activeRole={activeRole}
        onMarkRead={service.markNotificationRead}
        onMarkAllRead={() => service.markAllNotificationsRead(activeRole)}
        onSelectTask={(taskId) => {
          const t = allTasks.find(item => item.id === taskId);
          if (t) setSelectedTaskForDetails(t);
        }}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
      />

      {/* 8. WhatsApp Simulated Modal */}
      <SimulatedWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        patientName={currentPatient.fullName}
      />

      {/* 10. Patient Feedback Modal */}
      {selectedPlanForFeedback && (
        <PatientFeedbackModal
          isOpen={true}
          carePlan={selectedPlanForFeedback}
          patientName={currentPatient.fullName}
          patientId={currentPatient.id}
          existingFeedback={selectedFeedbackToView}
          onClose={() => {
            setSelectedPlanForFeedback(null);
            setSelectedFeedbackToView(null);
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {/* 11. Doctor Feedback Review Modal */}
      {selectedFeedbackForReview && (
        <FeedbackReviewModal
          isOpen={true}
          feedback={selectedFeedbackForReview}
          onClose={() => setSelectedFeedbackForReview(null)}
          onCompleteReview={handleFeedbackReview}
        />
      )}

      {/* 9. Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
export default DemoPortalPage;
