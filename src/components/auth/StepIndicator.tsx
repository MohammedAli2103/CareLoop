import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 1-indexed
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`w-full max-w-xl mx-auto py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-sky-500 transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : isCurrent
                    ? 'bg-sky-500 text-white ring-4 ring-sky-100 font-bold shadow-sm'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium whitespace-nowrap transition-colors ${
                  isCurrent ? 'text-sky-600 font-semibold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
