import React, { useState } from 'react';
import { CareTask, DelayReason } from '../../types';
import { Modal } from '../ui/Modal';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';

interface PatientHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CareTask;
  onSubmitHelp: (taskId: string, reason: DelayReason, note: string) => void;
}

export const PatientHelpModal: React.FC<PatientHelpModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmitHelp
}) => {
  const [selectedReason, setSelectedReason] = useState<DelayReason>('Transportation Barriers');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reasons: { key: DelayReason; title: string; desc: string; icon: string }[] = [
    {
      key: 'Out-of-Pocket Lab Cost',
      title: 'Cost',
      desc: 'The test fee or co-pay is too expensive right now.',
      icon: '💵'
    },
    {
      key: 'Transportation Barriers',
      title: 'Travel',
      desc: 'I do not have a ride or it is too far to travel.',
      icon: '🚗'
    },
    {
      key: 'Work / Family Schedule Conflict',
      title: 'Scheduling',
      desc: 'I cannot make it during regular clinic hours.',
      icon: '📅'
    },
    {
      key: 'Other',
      title: 'Other',
      desc: 'I have another concern or question about this test.',
      icon: '💬'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitHelp(task.id, selectedReason, note);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Need help with this test?"
      subtitle={`Let us know what is making it difficult to complete your ${task.title}.`}
      maxWidth="md"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">We received your note!</h4>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Your clinic coordinator (Nida Ali) will follow up with options to help you complete this test.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please choose the main reason for the delay:
          </p>

          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r.key}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedReason === r.key
                    ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="help-reason"
                  checked={selectedReason === r.key}
                  onChange={() => setSelectedReason(r.key)}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Add any extra details (optional):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Saturday morning would work best for me..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Send Note to Clinic</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
