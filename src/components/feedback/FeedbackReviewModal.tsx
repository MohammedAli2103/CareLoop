import React, { useState } from 'react';
import { PatientFeedback, NextAction, TaskType, ReviewFeedbackPayload } from '../../types';
import { Modal } from '../ui/Modal';
import {
  ShieldCheck,
  AlertTriangle,
  Star,
  CheckCircle2,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface FeedbackReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: PatientFeedback;
  onCompleteReview: (feedbackId: string, data: ReviewFeedbackPayload) => Promise<any>;
}

export const FeedbackReviewModal: React.FC<FeedbackReviewModalProps> = ({
  isOpen,
  onClose,
  feedback,
  onCompleteReview
}) => {
  const isAlreadyReviewed = feedback.reviewStatus === 'reviewed';

  // Form states
  const [doctorResponse, setDoctorResponse] = useState(
    feedback.doctorResponse || ''
  );
  const [nextAction, setNextAction] = useState<NextAction | 'New Care Plan Created'>(
    (feedback.nextAction as any) || 'Follow-Up Scheduled'
  );
  const [careGapIdentified, setCareGapIdentified] = useState(
    feedback.careGapIdentified || ''
  );
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState(
    feedback.worseningReported
      ? `Priority Clinical Consultation: ${feedback.patientName}`
      : `Care-Loop Follow-Up: ${feedback.carePlanTitle}`
  );
  const [taskType, setTaskType] = useState<TaskType>('Follow-Up Visit');
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [taskInstructions, setTaskInstructions] = useState(
    'Schedule follow-up appointment to address patient-reported barriers and evaluate recovery.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!doctorResponse.trim()) {
      setErrorMessage('Physician evaluation note is required to close the care loop.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCompleteReview(feedback.id, {
        doctorResponse: doctorResponse.trim(),
        nextAction,
        careGapIdentified: careGapIdentified.trim() || undefined,
        createFollowUpTask,
        followUpTaskDetails: createFollowUpTask
          ? {
              title: taskTitle.trim(),
              taskType,
              deadlineDays,
              instructions: taskInstructions.trim()
            }
          : undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const improvementMap: Record<string, { label: string; color: string }> = {
    much_better: { label: 'Much better', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    somewhat_better: { label: 'Somewhat better', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    no_change: { label: 'No change', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    worse_than_before: { label: 'Worse than before', color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' }
  };

  const adherenceMap: Record<string, string> = {
    followed_all: 'Followed all instructions',
    followed_some: 'Followed some instructions',
    unable_to_follow: 'Unable to follow instructions'
  };

  const barrierMap: Record<string, string> = {
    no_difficulties: 'No difficulties encountered',
    cost: 'Treatment or medicine cost barrier',
    travel_or_access: 'Travel, distance, or appointment access',
    side_effects: 'Side effects or discomfort',
    unclear_instructions: 'Unclear instructions or lack of support',
    other: 'Other barrier'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physician Feedback Evaluation & Closed-Loop Review"
      subtitle={`Patient: ${feedback.patientName} (${feedback.patientMrn}) • Plan: ${feedback.carePlanTitle}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-800">
        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Patient-Reported PROM Summary Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-xs text-slate-900">
                Patient-Reported Outcome Summary
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= feedback.experienceRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200'
                  }`}
                />
              ))}
              <span className="text-[11px] font-bold text-slate-600 ml-1">
                {feedback.experienceRating}/5
              </span>
            </div>
          </div>

          {/* Critical Worsening Alert if present */}
          {feedback.worseningReported && (
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 space-y-1.5 text-rose-900">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>CLINICAL ESCALATION: PATIENT REPORTED WORSENING SYMPTOMS</span>
              </div>
              <p className="text-[11px] text-rose-900 font-medium">
                {feedback.worseningDetails || 'Patient indicated condition is worse than before start of protocol.'}
              </p>
            </div>
          )}

          {/* Grid of Key PROM Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Condition Outcome
              </span>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] border ${
                  improvementMap[feedback.improvementStatus]?.color || 'bg-slate-100 text-slate-800'
                }`}>
                  {improvementMap[feedback.improvementStatus]?.label || feedback.improvementStatus}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Prescription Adherence
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {adherenceMap[feedback.adherenceStatus] || feedback.adherenceStatus}
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Reported Barriers
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {barrierMap[feedback.barrierType] || feedback.barrierType}
              </p>
              {feedback.barrierOtherDetails && (
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  &ldquo;{feedback.barrierOtherDetails}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Patient Additional Comments */}
          {feedback.comments && (
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Patient Free-Text Comments
              </span>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                &ldquo;{feedback.comments}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* 2. Clinician Loop Closure & Action Section */}
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Physician Evaluation & Documented Next Steps
            </h4>
          </div>

          {/* Care Gap Identification */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Identified Care Gap / Adherence Barrier
            </label>
            <input
              type="text"
              disabled={isAlreadyReviewed}
              value={careGapIdentified}
              onChange={(e) => setCareGapIdentified(e.target.value)}
              placeholder="e.g., Prescription cost burden, medication side-effect discomfort, fasting confusion..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs bg-white text-slate-800"
            />
          </div>

          {/* Doctor Response / Decision Note */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Physician Clinical Review & Decision <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              disabled={isAlreadyReviewed}
              value={doctorResponse}
              onChange={(e) => setDoctorResponse(e.target.value)}
              placeholder="Document your clinical findings, adjustments, and directives to the patient..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs bg-white text-slate-800 resize-y"
            />
          </div>

          {/* Documented Next Action */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Closed-Loop Next Step <span className="text-rose-500">*</span>
            </label>
            <select
              value={nextAction}
              disabled={isAlreadyReviewed}
              onChange={(e) => setNextAction(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs bg-white text-slate-800 font-medium"
            >
              <option value="Follow-Up Scheduled">Follow-Up Scheduled (In-Person or Telehealth)</option>
              <option value="Medication Adjustment">Medication Adjustment (Dose / Class Modification)</option>
              <option value="Specialist Referral">Specialist Referral (Cardiology / Endocrinology)</option>
              <option value="Routine 90-Day Monitoring">Routine 90-Day Monitoring</option>
              <option value="New Care Plan Created">New Care Plan Created</option>
              <option value="No Further Action Needed">No Further Action Needed (Loop Resolved)</option>
            </select>
          </div>

          {/* Follow-up Task Linkage Toggle */}
          {!isAlreadyReviewed && (
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="createFollowUpToggle"
                    type="checkbox"
                    checked={createFollowUpTask}
                    onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="createFollowUpToggle" className="font-bold text-xs text-slate-900 cursor-pointer select-none">
                    Generate and assign follow-up care task to patient
                  </label>
                </div>
                <span className="text-[10px] text-sky-800 font-semibold bg-sky-100 px-2 py-0.5 rounded-md">
                  Action Linkage
                </span>
              </div>

              {createFollowUpTask && (
                <div className="pt-2 border-t border-sky-200/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Task Type
                      </label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as TaskType)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      >
                        <option value="Follow-Up Visit">Follow-Up Visit</option>
                        <option value="Specialist Referral">Specialist Referral</option>
                        <option value="Lab Test">Lab Test</option>
                        <option value="Imaging">Imaging</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Deadline (Days from today)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={taskInstructions}
                        onChange={(e) => setTaskInstructions(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Fulfills Clinical Closed-Loop Standard</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {!isAlreadyReviewed && (
              <button
                type="submit"
                disabled={isSubmitting || !doctorResponse.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Review...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Review & Close Loop</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
