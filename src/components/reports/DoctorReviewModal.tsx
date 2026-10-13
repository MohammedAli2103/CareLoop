import React, { useState } from 'react';
import { CareTask, NextAction } from '../../types';
import { Modal } from '../ui/Modal';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface DoctorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CareTask;
  onCompleteReview: (taskId: string, data: {
    reviewNotes: string;
    nextAction: NextAction;
    followUpDate?: string;
  }) => void;
}

export const DoctorReviewModal: React.FC<DoctorReviewModalProps> = ({
  isOpen,
  onClose,
  task,
  onCompleteReview
}) => {
  const getInitialNotes = (t: CareTask) => {
    const title = t.title.toLowerCase();
    if (title.includes('lipid') || title.includes('cholesterol')) {
      return 'Fasting lipid panel reviewed. Moderate hypertriglyceridemia and elevated LDL noted. Plan: Initiate atorvastatin therapy, dietary modification, and reassess in 60 days.';
    }
    if (title.includes('x-ray') || title.includes('chest')) {
      return 'Chest radiography reviewed. Clear lung parenchyma without active cardiopulmonary process or infiltrates. Baseline pulmonary clearance documented.';
    }
    if (title.includes('thyroid')) {
      return 'Thyroid panel evaluated. Mildly elevated TSH (5.4 mIU/L) with normal Free T4. Plan: Specialist endocrine referral and monitor symptoms.';
    }
    return 'Diagnostic findings reviewed. Clinical findings communicated to patient. Care loop successfully updated with follow-up directives.';
  };

  const getInitialNextAction = (t: CareTask): NextAction => {
    const title = t.title.toLowerCase();
    if (title.includes('lipid')) return 'Medication Adjustment';
    if (title.includes('x-ray')) return 'Routine 90-Day Monitoring';
    if (title.includes('thyroid')) return 'Specialist Referral';
    return 'Follow-Up Scheduled';
  };

  const [reviewNotes, setReviewNotes] = useState(() => getInitialNotes(task));
  const [nextAction, setNextAction] = useState<NextAction>(() => getInitialNextAction(task));
  const [followUpDate, setFollowUpDate] = useState('2026-11-24');

  React.useEffect(() => {
    setReviewNotes(getInitialNotes(task));
    setNextAction(getInitialNextAction(task));
  }, [task]);

  const report = task.report;
  const verifiedResults = report?.extractedResults || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) return;

    onCompleteReview(task.id, {
      reviewNotes,
      nextAction,
      followUpDate
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physician Clinical Review & Loop Closure"
      subtitle={`Patient: ${task.patientName} • Order: ${task.title}`}
      maxWidth="2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Fulfills Clinical Review Obligation</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!reviewNotes.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sign Off &amp; Resolve Care Loop</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verification provenance badge */}
        <div className="rounded-xl bg-teal-50/70 p-3.5 border border-teal-200/80 text-xs text-teal-950 flex items-start justify-between gap-3">
          <div>
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Staff-Verified Laboratory Findings
            </span>
            <p className="mt-0.5 text-[11px] text-teal-800">
              Verified by {report?.verifiedBy || 'Nida Ali (Care Coordinator)'} on {report?.verifiedAt ? new Date(report.verifiedAt).toLocaleDateString() : 'Recent'}.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-teal-200 text-teal-800">
            {report?.fileName || 'lab_report.pdf'}
          </span>
        </div>

        {/* Verified Results Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-700 flex justify-between">
            <span>Verified Analyte Results</span>
            <span className="text-slate-400 font-normal">Reference Intervals</span>
          </div>
          <div className="divide-y divide-slate-100">
            {verifiedResults.map((res, i) => (
              <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{res.testName}</span>
                  <p className="text-[10px] text-slate-400 font-mono">Ref: {res.refRange}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-sm text-slate-900">
                      {res.value} {res.unit}
                    </span>
                    {res.isAbnormal ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ABNORMAL
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        NORMAL
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Review Notes Field */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Clinical Evaluation &amp; Physician Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
            required
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white"
            placeholder="Record clinical impressions, medication changes, and instructions for the patient..."
          />
        </div>

        {/* Next Action Selection */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Next Clinical Action Required
              </label>
              <select
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value as NextAction)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white"
              >
                <option value="Medication Adjustment">Medication Adjustment</option>
                <option value="Follow-Up Scheduled">Follow-Up Consultation Scheduled</option>
                <option value="Specialist Referral">Specialist Referral</option>
                <option value="Routine 90-Day Monitoring">Routine 90-Day Monitoring</option>
                <option value="No Further Action Needed">No Further Action Needed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Target Follow-Up Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white pl-9"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {nextAction !== 'No Further Action Needed' && (
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 flex items-center gap-2">
              <span className="font-bold">Next Action Loop:</span>
              <span>
                Signing off will automatically create a new follow-up task in <strong>{task.patientName}</strong>&apos;s care plan and add it to your follow-up queue.
              </span>
            </div>
          )}
        </div>

        {/* Safety loop close notice */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Signing off moves task status to <strong>RESOLVED</strong>, closes the open coordination loop, and notifies {task.patientName} of clinical recommendations.
          </span>
        </div>
      </form>
    </Modal>
  );
};
