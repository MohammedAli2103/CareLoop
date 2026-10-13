import React, { useState } from 'react';
import { CarePlan, PatientFeedback, ImprovementStatus, AdherenceStatus, BarrierType, SubmitFeedbackPayload } from '../../types';
import { Modal } from '../ui/Modal';
import {
  Star,
  AlertTriangle,
  Heart,
  CheckCircle2,
  ShieldAlert,
  Send,
  Loader2,
  FileCheck2,
  PhoneCall
} from 'lucide-react';

interface PatientFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  carePlan: CarePlan;
  patientName?: string;
  patientId?: string;
  existingFeedback?: PatientFeedback | null;
  onSubmit: (payload: SubmitFeedbackPayload) => Promise<any>;
}

export const PatientFeedbackModal: React.FC<PatientFeedbackModalProps> = ({
  isOpen,
  onClose,
  carePlan,
  patientName,
  patientId,
  existingFeedback,
  onSubmit
}) => {
  const isViewOnly = Boolean(existingFeedback);

  // Form State
  const [improvementStatus, setImprovementStatus] = useState<ImprovementStatus>(
    existingFeedback?.improvementStatus || 'somewhat_better'
  );
  const [adherenceStatus, setAdherenceStatus] = useState<AdherenceStatus>(
    existingFeedback?.adherenceStatus || 'followed_all'
  );
  const [barrierType, setBarrierType] = useState<BarrierType>(
    existingFeedback?.barrierType || 'no_difficulties'
  );
  const [barrierOtherDetails, setBarrierOtherDetails] = useState<string>(
    existingFeedback?.barrierOtherDetails || ''
  );
  const [experienceRating, setExperienceRating] = useState<number>(
    existingFeedback?.experienceRating || 5
  );
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>(
    existingFeedback?.comments || ''
  );
  const [worseningReported, setWorseningReported] = useState<boolean>(
    existingFeedback?.worseningReported || false
  );
  const [worseningDetails, setWorseningDetails] = useState<string>(
    existingFeedback?.worseningDetails || ''
  );
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(
    existingFeedback?.safetyAcknowledged || false
  );

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Symptom-safety trigger: either patient checked worsening or marked worse than before
  const isWorseningPathwayActive = worseningReported || improvementStatus === 'worse_than_before';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!experienceRating || experienceRating < 1 || experienceRating > 5) {
      setErrorMessage('Please select an overall care experience rating (1 to 5 stars).');
      return;
    }

    if (comments.length > 3000) {
      setErrorMessage('Additional comments cannot exceed 3,000 characters.');
      return;
    }

    if (barrierType === 'other' && !barrierOtherDetails.trim()) {
      setErrorMessage('Please specify the difficulties you encountered in the text field.');
      return;
    }

    if (isWorseningPathwayActive && !safetyAcknowledged) {
      setErrorMessage('Please acknowledge the Emergency Medical Advisory before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        carePlanId: carePlan.id,
        patientId,
        improvementStatus,
        adherenceStatus,
        barrierType,
        barrierOtherDetails: barrierType === 'other' ? barrierOtherDetails.trim() : undefined,
        experienceRating,
        comments: comments.trim() ? comments.trim() : undefined,
        worseningReported: isWorseningPathwayActive,
        worseningDetails: isWorseningPathwayActive ? worseningDetails.trim() : undefined,
        safetyAcknowledged: isWorseningPathwayActive ? safetyAcknowledged : false
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to submit feedback. Your responses have been saved here. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor — Unsatisfactory experience',
    2: 'Fair — Significant room for improvement',
    3: 'Good — Met care expectations',
    4: 'Very Good — Attentive & effective care',
    5: 'Excellent — Outstanding clinical support'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? 'Submitted Care Feedback' : 'Care Plan Outcome & Feedback'}
      subtitle={patientName ? `Patient: ${patientName} • Plan: ${carePlan.title}` : `Plan: ${carePlan.title} • Doctor: ${carePlan.doctorName}`}
      maxWidth="2xl"
    >
      {isSuccess ? (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Feedback Successfully Submitted</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for sharing your experience. Your responses have been routed directly to{' '}
              <span className="font-semibold text-slate-900">{carePlan.doctorName}</span> for clinical evaluation and next-step coordination.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 max-w-md mx-auto space-y-1">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-teal-600" /> Closed-Loop Care Next Steps:
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Your care team will review your improvement status and adherence. If further tests, adjustments, or follow-up consultations are warranted, you will receive an in-app care alert.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-800">
          {/* Header Reassurance Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-sky-50 border border-emerald-100 p-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-2xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-950 text-xs">Closing the Loop on Your Care</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                A completed care plan is an important milestone, but we also want to know how you are truly doing. Your honest answers help your physician assess recovery and customize ongoing care.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Please check your submission:</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section A: Improvement Status */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900">
              1. How has your condition changed since starting this care plan? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'much_better', label: 'Much better', icon: '🌟', color: 'peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-900' },
                { value: 'somewhat_better', label: 'Somewhat better', icon: '👍', color: 'peer-checked:bg-teal-50 peer-checked:border-teal-500 peer-checked:text-teal-900' },
                { value: 'no_change', label: 'No change', icon: '➖', color: 'peer-checked:bg-slate-100 peer-checked:border-slate-400 peer-checked:text-slate-900' },
                { value: 'worse_than_before', label: 'Worse than before', icon: '⚠️', color: 'peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-900' }
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-all text-center select-none ${
                    isViewOnly ? 'pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="improvementStatus"
                    value={opt.value}
                    checked={improvementStatus === opt.value}
                    disabled={isViewOnly}
                    onChange={() => setImprovementStatus(opt.value as ImprovementStatus)}
                    className="peer sr-only"
                  />
                  <span className="text-lg mb-1">{opt.icon}</span>
                  <span className="font-semibold text-xs text-slate-700 peer-checked:font-bold peer-checked:text-slate-900">
                    {opt.label}
                  </span>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-teal-600 pointer-events-none" />
                </label>
              ))}
            </div>
          </div>

          {/* Section B: Care-Plan Adherence */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900">
              2. How closely were you able to follow the prescribed care instructions? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { value: 'followed_all', label: 'Followed all instructions', desc: 'Completed all tests, visits, and medications' },
                { value: 'followed_some', label: 'Followed some instructions', desc: 'Managed parts of the plan, but missed some' },
                { value: 'unable_to_follow', label: 'Unable to follow instructions', desc: 'Faced substantial obstacles preventing completion' }
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`relative flex flex-col p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-all select-none ${
                    isViewOnly ? 'pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="adherenceStatus"
                    value={opt.value}
                    checked={adherenceStatus === opt.value}
                    disabled={isViewOnly}
                    onChange={() => setAdherenceStatus(opt.value as AdherenceStatus)}
                    className="peer sr-only"
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      adherenceStatus === opt.value ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                    }`}>
                      {adherenceStatus === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-5.5 leading-snug">{opt.desc}</span>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-teal-600 pointer-events-none" />
                </label>
              ))}
            </div>
          </div>

          {/* Section C: Barriers Encountered */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900">
              3. Did you encounter any barriers or difficulties along the way? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: 'no_difficulties', label: 'No difficulties' },
                { value: 'cost', label: 'Treatment or medicine cost' },
                { value: 'travel_or_access', label: 'Travel, distance, or appointment access' },
                { value: 'side_effects', label: 'Side effects or discomfort' },
                { value: 'unclear_instructions', label: 'Unclear instructions or lack of support' },
                { value: 'other', label: 'Other' }
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-all select-none ${
                    isViewOnly ? 'pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="barrierType"
                    value={opt.value}
                    checked={barrierType === opt.value}
                    disabled={isViewOnly}
                    onChange={() => setBarrierType(opt.value as BarrierType)}
                    className="peer sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    barrierType === opt.value ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                  }`}>
                    {barrierType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="font-semibold text-xs text-slate-800">{opt.label}</span>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-teal-600 pointer-events-none" />
                </label>
              ))}
            </div>

            {/* Optional details if 'Other' is chosen */}
            {barrierType === 'other' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={barrierOtherDetails}
                  disabled={isViewOnly}
                  onChange={(e) => setBarrierOtherDetails(e.target.value)}
                  placeholder="Please describe the difficulties or barriers you faced..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-xs bg-white text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Section D: Overall Care Experience Rating (1 - 5 stars) */}
          <div className="space-y-2 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                4. Overall Care Experience Rating <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-teal-700">
                {ratingLabels[experienceRating] || `${experienceRating} of 5 Stars`}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = hoverRating ? star <= hoverRating : star <= experienceRating;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={isViewOnly}
                    onMouseEnter={() => !isViewOnly && setHoverRating(star)}
                    onMouseLeave={() => !isViewOnly && setHoverRating(0)}
                    onClick={() => !isViewOnly && setExperienceRating(star)}
                    className={`p-1.5 rounded-lg transition-transform ${
                      isViewOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
                    }`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section E: Additional Comments (Max 3,000 characters) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                5. Additional Comments (Optional)
              </label>
              <span className={`text-[11px] font-medium ${
                comments.length > 2800 ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {comments.length.toLocaleString()} / 3,000 characters
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={3000}
              value={comments}
              disabled={isViewOnly}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell your doctor about your experience, personal difficulties, concerns, or suggestions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-xs bg-white text-slate-800 resize-y"
            />
          </div>

          {/* Section F: Symptom-Safety Check & Escalation Pathway (Core Requirement 7) */}
          <div className={`rounded-2xl border p-4 space-y-3 transition-colors ${
            isWorseningPathwayActive
              ? 'border-rose-300 bg-rose-50/70'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-start gap-3">
              <input
                id="worseningCheckbox"
                type="checkbox"
                checked={worseningReported}
                disabled={isViewOnly}
                onChange={(e) => setWorseningReported(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="worseningCheckbox" className="cursor-pointer select-none">
                <span className="font-bold text-xs text-slate-900 block">
                  Safety Check: Are you experiencing new, worsening, or urgent symptoms?
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Check this box if your symptoms have deteriorated, if you feel acute discomfort, or if you need prompt clinical re-evaluation.
                </span>
              </label>
            </div>

            {/* HIGH-VISIBILITY EMERGENCY CLINICAL ADVISORY */}
            {isWorseningPathwayActive && (
              <div className="rounded-xl border border-rose-300 bg-white p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-start gap-2.5 text-rose-800">
                  <div className="p-1 rounded-md bg-rose-100 text-rose-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-rose-900 tracking-tight">
                      CRITICAL MEDICAL ADVISORY: POTENTIALLY URGENT SYMPTOMS
                    </p>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      If you are experiencing severe chest pain, sudden shortness of breath, sudden weakness, difficulty speaking, severe dizziness, or another life-threatening emergency,{' '}
                      <span className="font-bold underline">DO NOT wait for an online review</span>.
                    </p>
                    <div className="flex items-center gap-2 pt-1 font-bold text-xs text-rose-900">
                      <PhoneCall className="w-4 h-4 text-rose-600" />
                      <span>Call 911 / 112 or visit the nearest emergency hospital immediately.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-rose-100">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Describe your worsening symptoms for your doctor&apos;s review:
                  </label>
                  <textarea
                    rows={2}
                    value={worseningDetails}
                    disabled={isViewOnly}
                    onChange={(e) => setWorseningDetails(e.target.value)}
                    placeholder="e.g., Shortness of breath when climbing stairs, severe pain in left lower abdomen since Tuesday..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-xs bg-rose-50/40 text-slate-800"
                  />
                </div>

                {/* Patient Safety Acknowledgment */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="safetyAck"
                    type="checkbox"
                    checked={safetyAcknowledged}
                    disabled={isViewOnly}
                    onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-300 cursor-pointer"
                  />
                  <label htmlFor="safetyAck" className="text-[11px] font-medium text-slate-700 cursor-pointer select-none">
                    I understand that this feedback form is reviewed by my clinical team during standard operating hours and is <span className="font-bold">not an immediate emergency dispatch service</span>.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Disclaimer */}
          <p className="text-[11px] text-slate-400 italic">
            * CareLoop patient feedback is a structured reporting tool to assist your physician with follow-up decisions. It is not an automated medical diagnostic engine.
          </p>

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>

            {!isViewOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Care Feedback</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};
