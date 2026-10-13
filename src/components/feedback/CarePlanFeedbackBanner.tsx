import React from 'react';
import { CarePlan, PatientFeedback } from '../../types';
import {
  MessageSquareCheck,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface CarePlanFeedbackBannerProps {
  carePlan: CarePlan;
  feedback?: PatientFeedback | null;
  onOpenFeedbackModal: (carePlan: CarePlan) => void;
  onViewFeedbackModal?: (carePlan: CarePlan, feedback: PatientFeedback) => void;
}

export const CarePlanFeedbackBanner: React.FC<CarePlanFeedbackBannerProps> = ({
  carePlan,
  feedback,
  onOpenFeedbackModal,
  onViewFeedbackModal
}) => {
  // Only completed care plans are eligible for feedback prompt (Core Requirement 3)
  if (carePlan.status !== 'Completed') {
    return null;
  }

  const isSubmitted = Boolean(feedback);

  const getReviewStatusBadge = (status?: string) => {
    switch (status) {
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed by Physician
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" /> Pending Clinical Review
          </span>
        );
    }
  };

  const improvementLabels: Record<string, string> = {
    much_better: 'Much better',
    somewhat_better: 'Somewhat better',
    no_change: 'No change',
    worse_than_before: 'Worse than before'
  };

  return (
    <div className={`rounded-3xl p-5 sm:p-6 border transition-all ${
      isSubmitted
        ? 'bg-gradient-to-r from-slate-50 via-teal-50/20 to-sky-50/30 border-slate-200 shadow-2xs'
        : 'bg-gradient-to-r from-[#effcf6] via-[#f2faf7] to-[#e6f7f2] border-emerald-200/90 shadow-2xs'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side Info */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Care Plan Concluded
            </span>

            {isSubmitted ? (
              getReviewStatusBadge(feedback?.reviewStatus)
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Feedback Pending
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isSubmitted ? 'Care Plan Feedback Documented' : 'Share Your Care Plan Outcome & Experience'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {isSubmitted
                ? `You reported feeling "${improvementLabels[feedback?.improvementStatus || ''] || feedback?.improvementStatus}". Your physician uses this data to close the care loop.`
                : `Your care protocol "${carePlan.title}" has completed. Take 2 minutes to let ${carePlan.doctorName} know your progress, any barriers faced, and your overall recovery.`
              }
            </p>
          </div>

          {/* If reviewed, show doctor's guidance snippet */}
          {feedback?.doctorResponse && (
            <div className="mt-3 p-3.5 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Physician Follow-Up Directive
                </span>
                {feedback.nextAction && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    Next: {feedback.nextAction}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 italic">
                &ldquo;{feedback.doctorResponse}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Right Side Action */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          {isSubmitted ? (
            <div className="space-y-2 text-right">
              <div className="flex items-center gap-1 justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (feedback?.experienceRating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => onViewFeedbackModal ? onViewFeedbackModal(carePlan, feedback!) : onOpenFeedbackModal(carePlan)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>View Feedback Details</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenFeedbackModal(carePlan)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <MessageSquareCheck className="w-4 h-4" />
              <span>Submit Recovery Feedback</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
