import React, { useState } from 'react';
import { CareTask, TestResult } from '../../types';
import { Modal } from '../ui/Modal';
import { MockLabReportPreview } from './MockLabReportPreview';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface SplitScreenVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CareTask;
  onVerify: (taskId: string, results: TestResult[], notes: string) => void;
  onFlag: (taskId: string, reason: string) => void;
}

export const SplitScreenVerificationModal: React.FC<SplitScreenVerificationModalProps> = ({
  isOpen,
  onClose,
  task,
  onVerify,
  onFlag
}) => {
  const initialResults = task.report?.extractedResults || [];
  const [results, setResults] = useState<TestResult[]>(initialResults);
  const [auditNotes, setAuditNotes] = useState('Audited side-by-side against source document. Numerical values and units match certified laboratory report.');
  const [flagReason, setFlagReason] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);

  // Sync results when modal opens or task updates
  React.useEffect(() => {
    if (task.report?.extractedResults) {
      setResults(task.report.extractedResults);
    }
  }, [task]);

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...results];
    updated[index] = {
      ...updated[index],
      value: newValue,
      editedByStaff: true
    };
    setResults(updated);
  };

  const handleUnitChange = (index: number, newUnit: string) => {
    const updated = [...results];
    updated[index] = {
      ...updated[index],
      unit: newUnit,
      editedByStaff: true
    };
    setResults(updated);
  };

  const handleToggleAbnormal = (index: number) => {
    const updated = [...results];
    updated[index] = {
      ...updated[index],
      isAbnormal: !updated[index].isAbnormal,
      editedByStaff: true
    };
    setResults(updated);
  };

  const handleConfirmVerification = () => {
    onVerify(task.id, results, auditNotes);
    onClose();
  };

  const handleConfirmFlag = () => {
    if (!flagReason.trim()) return;
    onFlag(task.id, flagReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Split-Screen Verification (Human-in-the-Loop Audit)"
      subtitle={`Patient: ${task.patientName} • Diagnostic Task: ${task.title}`}
      maxWidth="5xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authorized Clinical Coordinator Sign-Off</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {!isFlagging ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsFlagging(true)}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  Flag Issue
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Match &amp; Route to Physician</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConfirmFlag}
                disabled={!flagReason.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Flag to Patient</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Safeguard Banner */}
        <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold">Clinical Safety Protocol:</span> OCR is treated as an error-prone drafter. Compare each extracted number on the right directly with the source report on the left. Correct any OCR character misreads (e.g. 7.4 vs 7.1) before committing to patient records.
          </div>
        </div>

        {isFlagging ? (
          /* Flag for correction form */
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Flag Report for Patient Re-Upload
            </h4>
            <p className="text-[11px] text-rose-700">
              Specify why this report cannot be verified (e.g., blurry image, missing patient identifier, wrong date of birth, incomplete page).
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for rejection/re-upload..."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-400 focus:outline-hidden bg-white"
            />
            <button
              type="button"
              onClick={() => setIsFlagging(false)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Back to Split-Screen Audit
            </button>
          </div>
        ) : (
          /* Split Screen: Left = Source Document, Right = Extracted OCR Fields */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 6 cols: Original Source Report */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Original Lab Document (Source of Truth)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {task.report?.fileName || 'report_source.pdf'}
                </span>
              </div>
              <div className="max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-100 p-2">
                <MockLabReportPreview task={task} />
              </div>
            </div>

            {/* Right 6 cols: OCR Extracted Fields */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  OCR Extracted Fields (Draft Queue)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  Editable if OCR errs
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {results.map((res, index) => (
                  <div
                    key={res.id || index}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{res.testName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {res.confidence}% OCR Match
                        </span>
                        {res.editedByStaff && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Staff Edited
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500">Extracted Value</label>
                        <input
                          type="text"
                          value={res.value}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          className="w-full mt-0.5 px-2.5 py-1.5 font-bold font-mono rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium text-slate-500">Unit</label>
                        <input
                          type="text"
                          value={res.unit}
                          onChange={(e) => handleUnitChange(index, e.target.value)}
                          className="w-full mt-0.5 px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium text-slate-500">Ref Range</label>
                        <div className="mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px] truncate">
                          {res.refRange}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleToggleAbnormal(index)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[10px] transition-colors ${
                          res.isAbnormal
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {res.isAbnormal ? 'Flagged ABNORMAL' : 'NORMAL'}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        Audited by Nida Ali (Care Coordinator)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coordinator Verification Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700">
                  Audit Notes for Ordering Physician
                </label>
                <textarea
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-800 bg-slate-50/50"
                  placeholder="Enter audit remarks..."
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Confirming match will transition status to <strong>VERIFIED</strong> and dispatch to {task.doctorName}.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
