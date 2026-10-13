import React, { useState } from 'react';
import { PatientFeedback } from '../../types';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  ShieldAlert,
  User
} from 'lucide-react';

interface DoctorFeedbackQueueProps {
  feedbacks: PatientFeedback[];
  onOpenReview: (feedback: PatientFeedback) => void;
}

export const DoctorFeedbackQueue: React.FC<DoctorFeedbackQueueProps> = ({
  feedbacks,
  onOpenReview
}) => {
  const [filter, setFilter] = useState<'all' | 'action_required' | 'pending' | 'reviewed'>('all');

  const pendingCount = feedbacks.filter(f => f.reviewStatus === 'pending').length;
  const actionRequiredCount = feedbacks.filter(f => f.reviewStatus === 'action_required').length;
  const reviewedCount = feedbacks.filter(f => f.reviewStatus === 'reviewed').length;

  const filtered = feedbacks.filter(f => {
    if (filter === 'all') return true;
    return f.reviewStatus === filter;
  });

  const improvementMap: Record<string, { label: string; color: string }> = {
    much_better: { label: 'Much better', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    somewhat_better: { label: 'Somewhat better', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    no_change: { label: 'No change', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    worse_than_before: { label: 'Worse than before', color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' }
  };

  const barrierMap: Record<string, string> = {
    no_difficulties: 'None',
    none: 'None',
    cost: 'Cost / Affordability',
    travel_or_access: 'Travel / Access',
    side_effects: 'Side Effects / Discomfort',
    unclear_instructions: 'Unclear Instructions',
    other: 'Other Barriers'
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
      {/* 1. Header with Title & Action Counter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-2xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] leading-tight">
                Patient Feedback & Closed-Loop Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluate post-protocol recovery outcomes and address patient-reported barriers.
              </p>
            </div>
          </div>

          {actionRequiredCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              {actionRequiredCount} Action Needed
            </span>
          )}
        </div>

        {/* 2. Filter Tabs Bar (Full Width & Clean) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            All Feedback ({feedbacks.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('action_required')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'action_required'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Action Required ({actionRequiredCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('reviewed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'reviewed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reviewed ({reviewedCount})</span>
          </button>
        </div>
      </div>

      {/* 3. Feedback Card Items */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No Patient Feedback in this View</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            {filter === 'action_required'
              ? 'Great! There are no unresolved worsening symptom reports or escalated barriers.'
              : 'Completed care plan patient outcomes will appear here as submissions arrive.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const isActionRequired = item.reviewStatus === 'action_required';
            const isReviewed = item.reviewStatus === 'reviewed';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4.5 transition-all shadow-2xs ${
                  isActionRequired
                    ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:bg-rose-50/40'
                    : isReviewed
                    ? 'border-slate-200 bg-white hover:border-emerald-300'
                    : 'border-slate-200/90 bg-white hover:border-sky-300'
                }`}
              >
                {/* Top Row: Patient Info + Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block leading-tight">
                        {item.patientName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.patientMrn || 'PT-RECORD'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Worsening Alert Pill */}
                    {item.worseningReported && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Worsening Symptoms
                      </span>
                    )}

                    {/* Review status badge */}
                    {isReviewed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reviewed
                      </span>
                    ) : isActionRequired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Action Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        <Clock className="w-3.5 h-3.5 text-sky-600" /> Pending Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan Context */}
                <div className="pt-2.5 pb-1">
                  <p className="text-xs text-slate-800">
                    <span className="font-bold text-slate-900">{item.carePlanTitle}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-500 font-medium">{item.carePlanDiagnosis}</span>
                  </p>
                </div>

                {/* Worsening Alert Detail Box */}
                {item.worseningReported && item.worseningDetails && (
                  <div className="my-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Patient Reported Worsening:</span>
                      <span className="text-[11px] leading-relaxed">{item.worseningDetails}</span>
                    </div>
                  </div>
                )}

                {/* PROM Metrics Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 text-[11px]">Outcome:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      improvementMap[item.improvementStatus]?.color || 'bg-slate-100 text-slate-800'
                    }`}>
                      {improvementMap[item.improvementStatus]?.label || item.improvementStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 text-[11px]">Barrier:</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {barrierMap[item.barrierType] || item.barrierType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 text-[11px]">Rating:</span>
                    <span className="font-extrabold text-amber-600 text-[11px] flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.experienceRating}/5
                    </span>
                  </div>
                </div>

                {/* Comments quotation if present */}
                {item.comments && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] text-slate-600 italic">
                    &ldquo;{item.comments}&rdquo;
                  </div>
                )}

                {/* Doctor response snippet if already reviewed */}
                {isReviewed && item.doctorResponse && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Physician Decision Recorded
                      </span>
                      {item.nextAction && (
                        <span className="px-2 py-0.5 bg-emerald-200/70 rounded text-[10px] uppercase font-bold tracking-wider">
                          {item.nextAction}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-900/90 italic">
                      &ldquo;{item.doctorResponse}&rdquo;
                    </p>
                  </div>
                )}

                {/* Action Button Row */}
                <div className="flex items-center justify-end pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenReview(item)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isActionRequired
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                        : isReviewed
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200'
                    }`}
                  >
                    <span>{isReviewed ? 'View Decision & Notes' : isActionRequired ? 'Evaluate & Close Loop' : 'Review Feedback'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
