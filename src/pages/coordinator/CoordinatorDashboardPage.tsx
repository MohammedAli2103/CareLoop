import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCareLoop } from '../../hooks/useCareLoop';
import { CareTask, TestResult, NextAction } from '../../types';
import { CoordinatorDashboard } from '../../components/dashboard/CoordinatorDashboard';
import { SplitScreenVerificationModal } from '../../components/reports/SplitScreenVerificationModal';
import { DoctorReviewModal } from '../../components/reports/DoctorReviewModal';
import { CareTaskDetailModal } from '../../components/care-tasks/CareTaskDetailModal';
import { NotificationsDrawer } from '../../components/notifications/NotificationsDrawer';
import { SimulatedWhatsAppModal } from '../../components/notifications/SimulatedWhatsAppModal';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { Logo } from '../../components/common/Logo';
import {
  ClipboardList,
  Bell,
  LogOut,
  Zap,
  Smartphone
} from 'lucide-react';

export const CoordinatorDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Modals
  const [selectedTaskForVerify, setSelectedTaskForVerify] = useState<CareTask | null>(null);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<CareTask | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<CareTask | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

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
    allTasks,
    notifications,
    actions
  } = useCareLoop('coordinator');

  const handleVerifySuccess = async (taskId: string, results: TestResult[], notes: string) => {
    try {
      const updated = await actions.verifyReport(taskId, results, notes);
      if (updated) {
        addToast(
          'success',
          'Document Verified',
          `Checked report routed to physician for review.`
        );
      } else {
        addToast('error', 'Error', 'Could not record report verification.');
      }
    } catch {
      addToast('error', 'Error', 'Verification failed.');
    }
  };

  const handleFlagReport = async (taskId: string, reason: string) => {
    try {
      const updated = await actions.flagReportForCorrection(taskId, reason);
      if (updated) {
        addToast('warning', 'Report Flagged', `Re-upload requested from patient: "${reason}".`);
      } else {
        addToast('error', 'Error', 'Could not flag report.');
      }
    } catch {
      addToast('error', 'Error', 'Flagging failed.');
    }
  };

  const handleCompleteReview = async (taskId: string, data: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }) => {
    try {
      const updated = await actions.completeDoctorReview(taskId, data);
      if (updated) {
        addToast('success', 'Review Recorded', 'Diagnostic loop closed.');
      }
    } catch {
      addToast('error', 'Error', 'Review completion failed.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Coordinator Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo to="/" size="sm" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ClipboardList className="w-3.5 h-3.5 text-amber-600" /> Care Coordinator Radar
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                actions.simulateTimeLeap();
                addToast('warning', 'Time Leap Triggered', 'Simulated +48h SLA elapsed. Overdue radar alert fired.');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-rose-600" /> Simulate Overdue (+48h)
            </button>

            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
            </button>

            {/* Notifications */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Coordinator Alerts"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {profile?.full_name || currentUser.fullName}
                </span>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  Care Coordinator
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
        <CoordinatorDashboard
          coordinator={currentUser}
          tasks={allTasks}
          onOpenTaskDetails={setSelectedTaskForDetails}
          onOpenVerify={setSelectedTaskForVerify}
          onOpenReview={setSelectedTaskForReview}
          onSimulateTimeLeap={() => {
            actions.simulateTimeLeap();
            addToast('warning', 'Time Leap Triggered', 'Simulated +48h SLA elapsed.');
          }}
          onNotifyDoctor={(task) => {
            actions.sendReminderToDoctor(task.id);
            addToast('info', 'Physician Reminder Dispatched', `Reminder sent to ${task.doctorName}.`);
          }}
          onNotifyPatient={(task) => {
            actions.sendReminderToPatient(task.id);
            addToast('info', 'Patient Safety Alert Dispatched', `Alert sent to ${task.patientName}.`);
          }}
        />
      </main>

      {/* MODALS */}
      {selectedTaskForVerify && selectedTaskForVerify.report && (
        <SplitScreenVerificationModal
          isOpen={true}
          task={selectedTaskForVerify}
          onClose={() => setSelectedTaskForVerify(null)}
          onVerify={handleVerifySuccess}
          onFlag={handleFlagReport}
        />
      )}

      {selectedTaskForReview && (
        <DoctorReviewModal
          isOpen={true}
          task={selectedTaskForReview}
          onClose={() => setSelectedTaskForReview(null)}
          onCompleteReview={handleCompleteReview}
        />
      )}

      {selectedTaskForDetails && (
        <CareTaskDetailModal
          isOpen={true}
          task={selectedTaskForDetails}
          activeRole="coordinator"
          onClose={() => setSelectedTaskForDetails(null)}
          onOpenVerify={setSelectedTaskForVerify}
          onOpenReview={setSelectedTaskForReview}
        />
      )}

      <SimulatedWhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        patientName="Sarah Khan"
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        activeRole="coordinator"
        onMarkRead={actions.markNotificationRead}
        onMarkAllRead={() => actions.markAllNotificationsRead('coordinator')}
        onSelectTask={(taskId) => {
          const t = allTasks.find((item) => item.id === taskId);
          if (t) setSelectedTaskForDetails(t);
        }}
        onOpenWhatsAppModal={() => setIsWhatsAppOpen(true)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
