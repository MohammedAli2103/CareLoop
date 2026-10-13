import React from 'react';
import { TaskStatus } from '../../types';
import { 
  FileText, 
  TestTube2, 
  UploadCloud, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

interface CarePlanTimelineProps {
  currentStatus: TaskStatus;
  taskTitle: string;
  hasReport?: boolean;
  isVerified?: boolean;
  isReviewed?: boolean;
  isEscalated?: boolean;
}

export const CarePlanTimeline: React.FC<CarePlanTimelineProps> = ({
  currentStatus,
  taskTitle,
  hasReport = false,
  isVerified = false,
  isReviewed = false,
  isEscalated = false
}) => {
  // 5 clear steps representing CareLoop's core workflow
  const steps = [
    {
      step: 1,
      title: 'Ordered by Doctor',
      desc: 'Doctor created order with due date',
      icon: FileText,
      isDone: true,
      isActive: currentStatus === 'Pending' && !hasReport
    },
    {
      step: 2,
      title: 'Test Completed',
      desc: 'Patient visits lab for test',
      icon: TestTube2,
      isDone: hasReport || currentStatus === 'In Progress' || currentStatus === 'Verified' || currentStatus === 'Resolved',
      isActive: currentStatus === 'Pending'
    },
    {
      step: 3,
      title: 'Report Received',
      desc: 'Report document uploaded',
      icon: UploadCloud,
      isDone: hasReport,
      isActive: currentStatus === 'In Progress' && !isVerified
    },
    {
      step: 4,
      title: 'Checked by Staff',
      desc: 'Coordinator verifies report fields',
      icon: CheckCircle2,
      isDone: isVerified || currentStatus === 'Resolved',
      isActive: currentStatus === 'In Progress' && hasReport && !isVerified
    },
    {
      step: 5,
      title: 'Reviewed by Doctor',
      desc: 'Doctor reviews results & sets next step',
      icon: ShieldCheck,
      isDone: isReviewed || currentStatus === 'Resolved',
      isActive: currentStatus === 'Verified'
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Care Progress: {taskTitle}
          </h4>
          <p className="text-xs text-slate-500">
            Every step is tracked to make sure your results are never missed.
          </p>
        </div>

        {isEscalated && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Needs Attention (Coordinator Contacted)
          </span>
        )}
      </div>

      {/* Progress Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
        {steps.map((s) => {
          const Icon = s.icon;
          const isFinished = s.isDone;
          const isCurrent = s.isActive;

          return (
            <div
              key={s.step}
              className={`p-3 rounded-xl border text-left transition-all ${
                isFinished
                  ? 'border-teal-200 bg-teal-50/50 text-teal-900'
                  : isCurrent
                    ? 'border-amber-300 bg-amber-50/60 text-amber-950 ring-1 ring-amber-400'
                    : 'border-slate-200 bg-slate-50/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Step {s.step}
                </span>
                <div
                  className={`p-1.5 rounded-lg ${
                    isFinished
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-900">{s.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Reassurance note */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <span className="text-teal-700 font-bold shrink-0">How CareLoop Works:</span>
        <span className="text-[11px] leading-relaxed">
          Uploading your report lets our clinic team verify the numbers first. Once confirmed, your doctor reviews the findings and guides your next appointment or treatment.
        </span>
      </div>
    </div>
  );
};
