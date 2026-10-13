import React from 'react';
import { CareTask, UserRole } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { CountdownBadge } from '../ui/CountdownBadge';
import { 
  Building2, 
  UploadCloud, 
  FileCheck, 
  Stethoscope, 
  AlertTriangle, 
  HelpCircle,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface CareTaskCardProps {
  task: CareTask;
  activeRole: UserRole;
  onOpenDetails: (task: CareTask) => void;
  onOpenUpload?: (task: CareTask) => void;
  onOpenVerify?: (task: CareTask) => void;
  onOpenReview?: (task: CareTask) => void;
  onOpenDelayModal?: (task: CareTask) => void;
}

export const CareTaskCard: React.FC<CareTaskCardProps> = ({
  task,
  activeRole,
  onOpenDetails,
  onOpenUpload,
  onOpenVerify,
  onOpenReview,
  onOpenDelayModal
}) => {
  const isOverdue = task.taskStatus === 'Overdue';
  const isPending = task.taskStatus === 'Pending';
  const isInProgress = task.taskStatus === 'In Progress';
  const isVerified = task.taskStatus === 'Verified';
  const isResolved = task.taskStatus === 'Resolved';

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md ${
        isOverdue
          ? 'border-rose-300 ring-1 ring-rose-300/40'
          : isInProgress
            ? 'border-sky-200'
            : isVerified
              ? 'border-teal-200'
              : 'border-slate-200/90'
      }`}
    >
      {/* Top Meta: Type & Status & Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {task.taskType}
          </span>
          <StatusBadge status={task.taskStatus} size="sm" />
        </div>

        <CountdownBadge deadline={task.deadline} isResolved={isResolved} />
      </div>

      {/* Title & Instructions */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
          {task.title}
        </h4>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.instructions}
        </p>
      </div>

      {/* Facility & Doctor Info */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{task.partnerFacility || 'Partner Lab'}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium text-slate-700">{task.doctorName}</span>
        </div>
      </div>

      {/* Overdue Escalation Alert Box */}
      {isOverdue && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Safety Escalation Active:</span>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-snug">
              {task.escalationReason || 'Task exceeded deadline without verified lab report. Escalated to Clinical Coordinator on-call.'}
            </p>
          </div>
        </div>
      )}

      {/* Report Summary Pill if uploaded */}
      {task.report && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-800 text-[11px] truncate block">
                {task.report.fileName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {task.report.fileSize} • {task.report.verificationStatus}
              </span>
            </div>
          </div>
          {task.report.verificationStatus === 'Verified' ? (
            <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
              Staff Verified
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
              Draft OCR
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetails(task)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details &amp; History</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Patient Role Actions */}
          {activeRole === 'patient' && (
            <>
              {(isPending || isOverdue) && onOpenDelayModal && (
                <button
                  onClick={() => onOpenDelayModal(task)}
                  title="Report delay barrier (cost, transport, work)"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}

              {(isPending || isOverdue) && onOpenUpload && (
                <button
                  onClick={() => onOpenUpload(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-2xs transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Report</span>
                </button>
              )}

              {isInProgress && (
                <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Awaiting Staff Audit
                </span>
              )}

              {isVerified && (
                <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sent to Dr. Mehta
                </span>
              )}

              {isResolved && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Reviewed &amp; Resolved
                </span>
              )}
            </>
          )}

          {/* Coordinator Role Actions */}
          {activeRole === 'coordinator' && (
            <>
              {isInProgress && onOpenVerify && (
                <button
                  onClick={() => onOpenVerify(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-2xs transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Audit OCR vs PDF</span>
                </button>
              )}

              {isOverdue && (
                <button
                  onClick={() => onOpenDetails(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalation Actions</span>
                </button>
              )}
            </>
          )}

          {/* Doctor Role Actions */}
          {activeRole === 'doctor' && (
            <>
              {isVerified && onOpenReview && (
                <button
                  onClick={() => onOpenReview(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Review &amp; Close Loop</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
