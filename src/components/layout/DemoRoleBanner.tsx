import React, { useState } from 'react';
import { UserRole } from '../../types';
import { UserCheck, Stethoscope, ShieldCheck, Zap, RotateCcw, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';

interface DemoRoleBannerProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSimulateTimeLeap: () => void;
  onResetData: () => void;
  onOpenWhatsApp: () => void;
}

export const DemoRoleBanner: React.FC<DemoRoleBannerProps> = ({
  currentRole,
  onRoleChange,
  onSimulateTimeLeap,
  onResetData,
  onOpenWhatsApp
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between border-b border-slate-800">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          CareLoop Hackathon Demo Mode • Active: <strong className="text-white capitalize">{currentRole}</strong>
        </span>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
        >
          <span>Show Demo Bar</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] text-slate-100 text-xs px-4 py-2 border-b border-slate-800 transition-all">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Persona Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Role View:
          </span>

          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onRoleChange('patient')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentRole === 'patient'
                  ? 'bg-[#1b64f2] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Patient (Sarah)</span>
            </button>

            <button
              onClick={() => onRoleChange('doctor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentRole === 'doctor'
                  ? 'bg-[#1b64f2] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor (Dr. Mehta)</span>
            </button>

            <button
              onClick={() => onRoleChange('coordinator')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentRole === 'coordinator'
                  ? 'bg-[#1b64f2] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coordinator (Nida)</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Triggers & Hide Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSimulateTimeLeap}
            title="Fast forward +48h: test overdue alert & coordinator radar"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 text-rose-300 hover:bg-rose-900 border border-rose-700/60 font-semibold text-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Overdue</span>
          </button>

          <button
            onClick={onOpenWhatsApp}
            title="Preview simulated patient WhatsApp alert"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 font-semibold text-xs transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulated WhatsApp</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset data back to clean initial demo state"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="text-[10px] text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-0.5"
            title="Collapse demo bar"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
