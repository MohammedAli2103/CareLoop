import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCareLoop } from '../../hooks/useCareLoop';
import { CareTask, CarePlan, PatientFeedback, SubmitFeedbackPayload } from '../../types';
import { PatientDashboard } from '../../components/dashboard/PatientDashboard';
import { CarePlanTimeline } from '../../components/care-plans/CarePlanTimeline';
import { ReportUploadModal } from '../../components/reports/ReportUploadModal';
import { CareTaskDetailModal } from '../../components/care-tasks/CareTaskDetailModal';
import { PatientHelpModal } from '../../components/care-tasks/PatientHelpModal';
import { PatientFeedbackModal } from '../../components/feedback/PatientFeedbackModal';
import { CarePlanFeedbackBanner } from '../../components/feedback/CarePlanFeedbackBanner';
import { NotificationsDrawer } from '../../components/notifications/NotificationsDrawer';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Logo } from '../../components/common/Logo';
import {
  FileText,
  UploadCloud,
  Bell,
  LogOut,
  Calendar,
  Activity,
  Layers,
  Heart
} from 'lucide-react';

export const PatientDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'reports'>('home');

  // Modals state
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<CareTask | null>(null);
  const [selectedTaskForUpload, setSelectedTaskForUpload] = useState<CareTask | null>(null);
  const [selectedTaskForHelp, setSelectedTaskForHelp] = useState<CareTask | null>(null);
  const [selectedPlanForFeedback, setSelectedPlanForFeedback] = useState<CarePlan | null>(null);
  const [selectedFeedbackToView, setSelectedFeedbackToView] = useState<PatientFeedback | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'info' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Connect to CareLoop service (Supabase backed)
  const patientId = profile?.id || 'patient-1';
  const {
    currentPatient,
    carePlans,
    roleTasks,
    notifications,
    feedbacks,
    actions
  } = useCareLoop('patient', patientId);

  const handleUploadSuccess = async (taskId: string, fileName: string, fileSize: string, file?: File) => {
    try {
      const updated = await actions.uploadReport(taskId, {
        file,
        fileName,
        fileSize,
        fileType: file?.type || 'application/pdf',
        patientId
      });

      if (updated) {
        addToast(
          'success',
          'Report Submitted Successfully',
          `"${fileName}" uploaded to private storage. Clinical coordinator notified for audit.`
        );
      } else {
        addToast('error', 'Upload Issue', 'Could not record diagnostic report.');
      }
    } catch {
      addToast('error', 'Upload Failed', 'Error uploading file.');
    }
  };

  const handleFeedbackSubmit = async (payload: SubmitFeedbackPayload) => {
    try {
      const res = await actions.submitPatientFeedback(payload);
      if (res) {
        addToast(
          'success',
          'Care Feedback Recorded',
          'Your recovery experience and feedback have been sent to your doctor for review.'
        );
      }
      return res;
    } catch (err: any) {
      addToast('error', 'Feedback Submission Issue', err?.message || 'Failed to submit feedback.');
      throw err;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Patient Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo to="/" size="sm" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> Patient Care Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Drawer Trigger */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Care Alerts"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Greeting & Sign Out */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'P'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {profile?.full_name || currentPatient.fullName}
                </span>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  MRN: {currentPatient.mrn}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header */}
      <div className="bg-white border-b border-slate-200/60 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" /> My Care Overview
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" /> Care Plan Timeline
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Diagnostic Reports ({roleTasks.filter((t) => t.report).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Real Patient Dashboard */}
        {activeTab === 'home' && (
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

        {/* TAB 2: Care Plan Timeline */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
              <h2 className="text-lg font-bold text-slate-900">My Care Plan Timeline</h2>
              <p className="text-xs text-slate-500 mt-1">
                Ordered by {currentPatient.assignedDoctorName}. Track status of each ordered test from submission to physician loop closure.
              </p>
            </div>

            {/* Completed Care Plan Outcome Feedback Banners */}
            {carePlans.filter(cp => cp.status === 'Completed').map((cp) => {
              const fb = (feedbacks || []).find(f => f.carePlanId === cp.id);
              return (
                <CarePlanFeedbackBanner
                  key={`timeline-banner-${cp.id}`}
                  carePlan={cp}
                  feedback={fb}
                  onOpenFeedbackModal={(plan) => {
                    setSelectedPlanForFeedback(plan);
                    setSelectedFeedbackToView(null);
                  }}
                  onViewFeedbackModal={(plan, fbItem) => {
                    setSelectedPlanForFeedback(plan);
                    setSelectedFeedbackToView(fbItem);
                  }}
                />
              );
            })}

            <div className="space-y-4">
              {roleTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-2xs">
                  <p className="text-sm font-semibold text-slate-700">No Care Plan Tasks Yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your doctor has not added diagnostic orders to your active care plan yet.
                  </p>
                </div>
              ) : (
                roleTasks.map((task) => (
                  <CarePlanTimeline
                    key={task.id}
                    currentStatus={task.taskStatus}
                    taskTitle={task.title}
                    hasReport={!!task.report}
                    isVerified={task.report?.verificationStatus === 'Verified'}
                    isReviewed={task.taskStatus === 'Resolved'}
                    isEscalated={task.isEscalated}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Reports List */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
              <h2 className="text-lg font-bold text-slate-900">My Diagnostic Reports</h2>
              <p className="text-xs text-slate-500 mt-1">
                Encrypted diagnostic documents and laboratory findings stored in private storage.
              </p>
            </div>

            <div className="space-y-3">
              {roleTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-2xs">
                  <p className="text-sm font-semibold text-slate-700">No Reports Available</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When diagnostic tests are ordered, you can upload lab documents and view results here.
                  </p>
                </div>
              ) : (
                roleTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{task.title}</span>
                        <StatusBadge status={task.taskStatus} size="sm" />
                      </div>
                      {task.report ? (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>{task.report.fileName} • {task.report.fileSize}</span>
                          <span className="text-slate-400">
                            (Uploaded {new Date(task.report.uploadedAt).toLocaleDateString()})
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">No document uploaded yet</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTaskForDetails(task)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        View Details
                      </button>
                      {!task.report && task.taskStatus !== 'Resolved' && (
                        <button
                          onClick={() => setSelectedTaskForUpload(task)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Upload File
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedTaskForUpload && (
        <ReportUploadModal
          isOpen={true}
          task={selectedTaskForUpload}
          onClose={() => setSelectedTaskForUpload(null)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {selectedTaskForDetails && (
        <CareTaskDetailModal
          isOpen={true}
          task={selectedTaskForDetails}
          activeRole="patient"
          onClose={() => setSelectedTaskForDetails(null)}
          onOpenUpload={setSelectedTaskForUpload}
          onRecordDelayReason={async (taskId, reason, notes) => {
            await actions.recordDelayReason(taskId, reason, notes);
            addToast('info', 'Note Recorded', 'Your care coordinator has been notified.');
          }}
        />
      )}

      {selectedTaskForHelp && (
        <PatientHelpModal
          isOpen={true}
          task={selectedTaskForHelp}
          onClose={() => setSelectedTaskForHelp(null)}
          onSubmitHelp={async (taskId, reason, notes) => {
            await actions.recordDelayReason(taskId, reason, notes);
            addToast('info', 'Note Recorded', 'Your care coordinator has been notified.');
          }}
        />
      )}

      {selectedPlanForFeedback && (
        <PatientFeedbackModal
          isOpen={true}
          carePlan={selectedPlanForFeedback}
          patientName={currentPatient.fullName}
          patientId={patientId}
          existingFeedback={selectedFeedbackToView}
          onClose={() => {
            setSelectedPlanForFeedback(null);
            setSelectedFeedbackToView(null);
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        activeRole="patient"
        onMarkRead={actions.markNotificationRead}
        onMarkAllRead={() => actions.markAllNotificationsRead('patient')}
        onSelectTask={(taskId) => {
          const t = roleTasks.find((item) => item.id === taskId);
          if (t) setSelectedTaskForDetails(t);
        }}
        onOpenWhatsAppModal={() => {}}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
