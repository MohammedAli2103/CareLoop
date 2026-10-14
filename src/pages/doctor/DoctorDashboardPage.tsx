import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCareLoop } from '../../hooks/useCareLoop';
import { CareTask, NextAction, TaskType, PatientFeedback, ReviewFeedbackPayload } from '../../types';
import { DoctorDashboard } from '../../components/dashboard/DoctorDashboard';
import { DoctorReviewModal } from '../../components/reports/DoctorReviewModal';
import { FeedbackReviewModal } from '../../components/feedback/FeedbackReviewModal';
import { CarePlanCreateModal } from '../../components/care-plans/CarePlanCreateModal';
import { CareTaskDetailModal } from '../../components/care-tasks/CareTaskDetailModal';
import { NotificationsDrawer } from '../../components/notifications/NotificationsDrawer';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { Logo } from '../../components/common/Logo';
import {
  Stethoscope,
  PlusCircle,
  Bell,
  LogOut
} from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Modals
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<CareTask | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<CareTask | null>(null);
  const [selectedFeedbackForReview, setSelectedFeedbackForReview] = useState<PatientFeedback | null>(null);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
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

  const {
    currentUser,
    patients,
    carePlans,
    allTasks,
    notifications,
    feedbacks,
    actions
  } = useCareLoop('doctor');

  const doctorUser = React.useMemo(() => {
    if (profile) {
      return {
        ...currentUser,
        id: profile.id,
        fullName: profile.full_name || currentUser.fullName,
        email: profile.email || currentUser.email
      };
    }
    return currentUser;
  }, [profile, currentUser]);

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
    try {
      const doctorId = profile?.id || data.doctorId;
      const res = await actions.createCarePlan({ ...data, doctorId });
      if (res && res.task) {
        addToast(
          'success',
          'Care Order Created',
          `Order "${res.task.title}" authored with deadline in ${data.deadlineDays} days.`
        );
      } else {
        addToast('error', 'Error', 'Could not create care plan order.');
      }
    } catch {
      addToast('error', 'Error', 'Failed to author care plan.');
    }
  };

  const handleCompleteReview = async (taskId: string, data: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }) => {
    try {
      const doctorName = profile?.full_name || currentUser.fullName;
      const updated = await actions.completeDoctorReview(taskId, { ...data, doctorName });
      if (updated) {
        addToast(
          'success',
          'Clinical Review Recorded',
          `Closed diagnostic loop with next action: "${data.nextAction}".`
        );
      } else {
        addToast('error', 'Review Error', 'Could not save physician evaluation.');
      }
    } catch {
      addToast('error', 'Review Failed', 'Failed to complete review.');
    }
  };

  const handleCompleteFeedbackReview = async (feedbackId: string, data: ReviewFeedbackPayload) => {
    try {
      const res = await actions.completeFeedbackReview(feedbackId, data, profile?.id || currentUser.id);
      if (res) {
        addToast(
          'success',
          'Feedback Evaluation Completed',
          `Closed loop for ${res.feedback.patientName}. Next action: "${data.nextAction}".`
        );
      } else {
        addToast('error', 'Review Error', 'Could not save feedback evaluation.');
      }
    } catch (err: any) {
      addToast('error', 'Review Failed', err?.message || 'Failed to complete review.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Doctor Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo to="/" size="sm" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" /> Physician Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatePlanModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> New Care Order
            </button>

            {/* Notifications */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clinical Alerts"
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
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'D'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {profile?.full_name || currentUser.fullName}
                </span>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  Attending Physician
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <DoctorDashboard
          doctor={doctorUser}
          patients={patients}
          carePlans={carePlans}
          tasks={allTasks}
          feedbacks={feedbacks}
          onOpenCreatePlan={() => setIsCreatePlanModalOpen(true)}
          onOpenReview={setSelectedTaskForReview}
          onOpenFeedbackReview={setSelectedFeedbackForReview}
          onOpenTaskDetails={setSelectedTaskForDetails}
          onSelectPatient={(_patientId) => {
            // Patient selected
          }}
          onCreateCarePlan={handleCreatePlan}
        />
      </main>

      {/* MODALS */}
      {selectedTaskForReview && (
        <DoctorReviewModal
          isOpen={true}
          task={selectedTaskForReview}
          onClose={() => setSelectedTaskForReview(null)}
          onCompleteReview={handleCompleteReview}
        />
      )}

      {selectedFeedbackForReview && (
        <FeedbackReviewModal
          isOpen={true}
          feedback={selectedFeedbackForReview}
          onClose={() => setSelectedFeedbackForReview(null)}
          onCompleteReview={handleCompleteFeedbackReview}
        />
      )}

      {selectedTaskForDetails && (
        <CareTaskDetailModal
          isOpen={true}
          task={selectedTaskForDetails}
          activeRole="doctor"
          onClose={() => setSelectedTaskForDetails(null)}
          onOpenReview={setSelectedTaskForReview}
        />
      )}

      {isCreatePlanModalOpen && (
        <CarePlanCreateModal
          isOpen={true}
          onClose={() => setIsCreatePlanModalOpen(false)}
          patients={patients}
          onCreate={handleCreatePlan}
        />
      )}

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        activeRole="doctor"
        onMarkRead={actions.markNotificationRead}
        onMarkAllRead={() => actions.markAllNotificationsRead('doctor')}
        onSelectTask={(taskId) => {
          const t = allTasks.find((item) => item.id === taskId);
          if (t) setSelectedTaskForDetails(t);
        }}
        onOpenWhatsAppModal={() => {}}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
