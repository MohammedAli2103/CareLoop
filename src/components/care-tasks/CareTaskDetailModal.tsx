import React, { useState } from 'react';
import { CareTask, UserRole, DelayReason } from '../../types';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { CountdownBadge } from '../ui/CountdownBadge';
import { CarePlanTimeline } from '../care-plans/CarePlanTimeline';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  HeartHandshake, 
  Send
} from 'lucide-react';

interface CareTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CareTask;
  activeRole: UserRole;
  onRecordDelayReason?: (taskId: string, reason: DelayReason, notes: string) => void;
  onOpenUpload?: (task: CareTask) => void;
  onOpenVerify?: (task: CareTask) => void;
  onOpenReview?: (task: CareTask) => void;
  onReassignTask?: (taskId: string, role: UserRole, notes: string) => void;
}

export const CareTaskDetailModal: React.FC<CareTaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  activeRole,
  onRecordDelayReason,
  onOpenUpload,
  onOpenVerify,
  onOpenReview,
  onReassignTask
}) => {
  const [selectedReason, setSelectedReason] = useState<DelayReason>(
    task.delayReason || 'Transportation Barriers'
  );
  const [delayNotes, setDelayNotes] = useState(task.delayNotes || '');
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [reassignRole, setReassignRole] = useState<UserRole>('coordinator');
  const [reassignNotes, setReassignNotes] = useState('Escalated to community health outreach team for home draw.');

  const handleSaveDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRecordDelayReason) {
      onRecordDelayReason(task.id, selectedReason, delayNotes);
      setShowDelayForm(false);
    }
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReassignTask) {
      onReassignTask(task.id, reassignRole, reassignNotes);
      onClose();
    }
  };

  // Contextual assistance suggestions for delay barriers (Page 6 of report)
  const getContextualAssistance = (reason: DelayReason) => {
    switch (reason) {
      case 'Out-of-Pocket Lab Cost':
        return {
          title: 'CareLoop Safety Fund Available',
          text: 'Apply for 40% subsidized diagnostic voucher at MetroPath Partner Clinics or request sliding-scale evaluation.',
          tag: 'Cost Assistance'
        };
      case 'Transportation Barriers':
        return {
          title: 'Free Medical Transit Ride Support',
          text: 'CareLoop can dispatch a non-emergency medical transportation voucher or arrange an in-home phlebotomist sample draw.',
          tag: 'Transit Support'
        };
      case 'Procedure Anxiety':
        return {
          title: 'Patient Navigator Support',
          text: 'Speak with a registered nurse coordinator for gentle prep guidance, pediatric needles, or comfort protocols.',
          tag: 'Clinical Support'
        };
      case 'Work / Family Schedule Conflict':
        return {
          title: 'Weekend & Extended Hours Locations',
          text: 'Nearest partner labs open Saturdays 7:00 AM - 1:00 PM with walk-in express testing.',
          tag: 'Flexible Booking'
        };
      default:
        return {
          title: 'Care Coordination Assistance',
          text: 'Our on-call coordinator can help adjust deadlines or reschedule lab appointments with Dr. Mehta.',
          tag: 'Coordination'
        };
    }
  };

  const assistance = getContextualAssistance(selectedReason);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={`Care Task #TASK-${task.id.slice(-4)} • Patient: ${task.patientName}`}
      maxWidth="4xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Created {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>

            {activeRole === 'patient' && (task.taskStatus === 'Pending' || task.taskStatus === 'Overdue') && onOpenUpload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpload(task);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
              >
                Upload Lab Report
              </button>
            )}

            {activeRole === 'coordinator' && task.taskStatus === 'In Progress' && onOpenVerify && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerify(task);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
              >
                Audit Report (Split-Screen)
              </button>
            )}

            {activeRole === 'doctor' && task.taskStatus === 'Verified' && onOpenReview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReview(task);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Complete Clinical Review
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={task.taskStatus} size="lg" />
            <CountdownBadge deadline={task.deadline} isResolved={task.taskStatus === 'Resolved'} />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Due Date: <strong>{new Date(task.deadline).toLocaleDateString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Physician: <strong>{task.doctorName}</strong></span>
            </div>
          </div>
        </div>

        {/* 6-Stage Timeline Component */}
        <CarePlanTimeline
          currentStatus={task.taskStatus}
          taskTitle={task.title}
          hasReport={!!task.report}
          isVerified={task.report?.verificationStatus === 'Verified'}
          isReviewed={task.taskStatus === 'Resolved'}
          isEscalated={task.isEscalated}
        />

        {/* Clinical Instructions & Facility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              Preparation &amp; Instructions
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{task.instructions}</p>
            {task.fastingRequired && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Strict 8-12 hour fasting required prior to specimen collection. Water only.</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              Diagnostic Location
            </h4>
            <p className="text-xs font-bold text-slate-800">{task.partnerFacility || 'MetroPath Central Clinic'}</p>
            <p className="text-xs text-slate-500 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{task.facilityAddress || '420 Lexington Health Blvd, Suite 200, Metro City'}</span>
            </p>
            <p className="text-[11px] text-teal-700 font-medium">Walk-ins welcome with CareLoop Order #TASK-{task.id.slice(-4)}</p>
          </div>
        </div>

        {/* Overdue Escalation Information */}
        {task.isEscalated && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Needs Attention — Coordinator Alert</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              {task.escalationReason}
            </p>
            <div className="text-[11px] text-rose-700 flex flex-wrap gap-4 pt-1">
              <span>Assigned Coordinator: <strong>{task.escalatedTo || 'Nida Ali (Care Coordinator)'}</strong></span>
              <span>Escalated at: <strong>{task.escalatedAt ? new Date(task.escalatedAt).toLocaleString() : 'Recent'}</strong></span>
            </div>

            {/* Coordinator Reassignment Action */}
            {activeRole === 'coordinator' && onReassignTask && (
              <form onSubmit={handleReassign} className="mt-3 pt-3 border-t border-rose-200/80 space-y-2">
                <span className="text-xs font-bold text-rose-950 block">Reassign Care Gap Action:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={reassignRole}
                    onChange={(e) => setReassignRole(e.target.value as UserRole)}
                    className="text-xs p-2 rounded-lg border border-rose-300 bg-white text-slate-900"
                  >
                    <option value="coordinator">Keep with Coordinator (Outreach Call)</option>
                    <option value="doctor">Re-route to Ordering Physician (Dr. Mehta)</option>
                    <option value="patient">Re-notify Patient with Transit Voucher</option>
                  </select>
                  <input
                    type="text"
                    value={reassignNotes}
                    onChange={(e) => setReassignNotes(e.target.value)}
                    placeholder="Action notes..."
                    className="text-xs p-2 rounded-lg border border-rose-300 bg-white text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors"
                >
                  Confirm Reassignment
                </button>
              </form>
            )}
          </div>
        )}

        {/* Delay Reason Barrier Reporting (Value-Add Feature from Page 6 & 7) */}
        {(task.taskStatus === 'Pending' || task.taskStatus === 'Overdue') && onRecordDelayReason && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <span>Encountering Barriers or Delays? (Patient Assistance)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDelayForm(!showDelayForm)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
              >
                {showDelayForm ? 'Hide Form' : 'Report Barrier / Request Assistance'}
              </button>
            </div>

            {task.delayReason && !showDelayForm && (
              <div className="text-xs text-amber-900 space-y-1">
                <p>Reported Barrier: <strong className="font-semibold">{task.delayReason}</strong></p>
                {task.delayNotes && <p className="text-[11px] text-amber-800 italic">&ldquo;{task.delayNotes}&rdquo;</p>}
              </div>
            )}

            {/* Contextual Assistance Suggestion */}
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{assistance.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {assistance.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{assistance.text}</p>
            </div>

            {showDelayForm && (
              <form onSubmit={handleSaveDelay} className="pt-2 space-y-2 border-t border-amber-200">
                <label className="block text-[11px] font-semibold text-amber-900">
                  Select Primary Barrier
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value as DelayReason)}
                  className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-900"
                >
                  <option value="Out-of-Pocket Lab Cost">Out-of-Pocket Lab Cost / High Copay</option>
                  <option value="Transportation Barriers">Transportation Barriers / Distance</option>
                  <option value="Procedure Anxiety">Procedure Anxiety / Needle Phobia</option>
                  <option value="Work / Family Schedule Conflict">Work / Family Schedule Conflict</option>
                  <option value="Awaiting Fasting Window">Awaiting Fasting Window</option>
                  <option value="Other">Other Reason</option>
                </select>

                <textarea
                  value={delayNotes}
                  onChange={(e) => setDelayNotes(e.target.value)}
                  placeholder="Additional context to help the care coordinator assist you..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-900"
                />

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Care Coordinator</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Doctor Review Notes (if resolved) */}
        {task.doctorReview && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Doctor Sign-Off &amp; Clinical Direction
            </h4>
            <p className="text-xs text-emerald-900 font-medium leading-relaxed">
              &ldquo;{task.doctorReview.reviewNotes}&rdquo;
            </p>
            <div className="pt-2 border-t border-emerald-200 flex flex-wrap justify-between text-[11px] text-emerald-800">
              <span>Next Action: <strong>{task.doctorReview.nextActionRequired}</strong></span>
              <span>Reviewed by: <strong>{task.doctorReview.doctorName}</strong></span>
              {task.doctorReview.followUpDate && (
                <span>Next Consult: <strong>{new Date(task.doctorReview.followUpDate).toLocaleDateString()}</strong></span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
