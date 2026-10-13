import React from 'react';
import { Modal } from '../ui/Modal';
import { CheckCheck, MapPin, Clock, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';

interface SimulatedWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
}

export const SimulatedWhatsAppModal: React.FC<SimulatedWhatsAppModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Alex Patel'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulated Patient WhatsApp Notification"
      subtitle="Demonstrating omnichannel patient engagement without third-party SMS costs"
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Encrypted magic link with OTP token verification
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Close Phone Preview
          </button>
        </div>
      }
    >
      {/* Smartphone frame container */}
      <div className="mx-auto max-w-sm rounded-[32px] border-4 border-slate-800 bg-slate-900 p-2 shadow-2xl">
        {/* Phone Speaker & Camera Notch */}
        <div className="h-4 w-full flex items-center justify-center mb-1">
          <div className="h-2 w-16 bg-slate-800 rounded-full" />
        </div>

        {/* WhatsApp App Screen */}
        <div className="rounded-[24px] bg-[#efeae2] overflow-hidden text-xs text-slate-800 flex flex-col min-h-[460px]">
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                CL
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs">CareLoop Health Safety</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <p className="text-[10px] text-emerald-100 opacity-90">Verified Healthcare Account</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {/* Encryption notice pill */}
            <div className="text-center">
              <span className="bg-[#ffeecd] text-[#54656f] text-[9px] px-2.5 py-1 rounded-md shadow-2xs font-sans inline-block max-w-[260px]">
                🔒 Messages and calls are end-to-end encrypted. Protected Health Information is guarded.
              </span>
            </div>

            {/* Message 1: Diagnostic Order Reminder */}
            <div className="max-w-[88%] bg-white rounded-lg rounded-tl-none p-3 shadow-xs space-y-2 border border-slate-200/60 font-sans">
              <div className="text-slate-900 leading-snug">
                Hello <strong>{patientName}</strong>, this is an automated health reminder from <strong>Dr. Arjun Mehta</strong>&apos;s team at Metro Health.
              </div>

              <div className="p-2 rounded bg-teal-50 border border-teal-200/80 text-[11px] space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-teal-700" />
                  <span>Order: HbA1c Glycated Blood Test</span>
                </div>
                <div className="text-teal-800 flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-teal-600" />
                  <span>Target SLA Deadline: <strong>Oct 16, 2026</strong> (3 Days Left)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">Preparation Instructions:</p>
                <p className="text-[10px] text-slate-600">
                  • 8-hour overnight water-only fasting recommended.
                  <br />• Routine blood pressure medications may be taken with water.
                </p>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3 h-3 text-teal-600" /> MetroPath Central Clinic
                </span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  09:15 AM <CheckCheck className="w-3 h-3 text-sky-500" />
                </span>
              </div>
            </div>

            {/* Message 2: Action Link */}
            <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none p-2.5 shadow-xs border border-slate-200/60 font-sans space-y-2">
              <p className="text-[11px] text-slate-800">
                Completed the test already? Tap below to upload your result sheet directly to CareLoop:
              </p>
              
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-teal-700 font-semibold text-[11px] flex items-center justify-between">
                <span>careloop.health/portal/PT-84920</span>
                <ExternalLink className="w-3 h-3" />
              </div>

              <div className="text-right text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
                09:16 AM <CheckCheck className="w-3 h-3 text-sky-500" />
              </div>
            </div>
          </div>

          {/* WhatsApp bottom bar */}
          <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 border-t border-slate-200 text-slate-400 text-xs">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400">
              Reply to CareLoop coordinator...
            </div>
            <div className="h-7 w-7 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0">
              🎤
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
