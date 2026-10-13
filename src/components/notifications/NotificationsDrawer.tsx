import React from 'react';
import { NotificationItem, UserRole } from '../../types';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Calendar, 
  Check, 
  Smartphone
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  activeRole: UserRole;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectTask: (taskId: string) => void;
  onOpenWhatsAppModal: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  activeRole,
  onMarkRead,
  onMarkAllRead,
  onSelectTask,
  onOpenWhatsAppModal
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'escalation':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'overdue_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'verification_needed':
        return <FileCheck className="w-4 h-4 text-sky-600" />;
      case 'doctor_review_ready':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">CareLoop Safety Center</h3>
                <p className="text-[11px] text-slate-500">
                  {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} for {activeRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 p-1.5 rounded hover:bg-teal-50"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick link to WhatsApp simulation */}
          <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Simulated WhatsApp Demo</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenWhatsAppModal();
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 underline"
            >
              Open Phone Preview
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No notifications for this role at this time.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkRead(notif.id);
                    if (notif.taskId) {
                      onClose();
                      onSelectTask(notif.taskId);
                    }
                  }}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer m-1 ${
                    notif.isRead
                      ? 'bg-white hover:bg-slate-50 opacity-80'
                      : 'bg-teal-50/40 border border-teal-100 hover:bg-teal-50/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-white shadow-2xs border border-slate-200/80 shrink-0">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">
                          {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="capitalize text-slate-500 font-medium">
                          {notif.channel === 'whatsapp' ? 'WhatsApp Channel' : 'In-App Alert'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
            CareLoop Event Dispatcher • Frontend Mock Service (Zero Paid SMS Costs)
          </div>
        </div>
      </div>
    </div>
  );
};
