import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface CountdownBadgeProps {
  deadline: string;
  isResolved?: boolean;
  className?: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  deadline,
  isResolved = false,
  className = ''
}) => {
  if (isResolved) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium ${className}`}>
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>Closed loop</span>
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-300 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}</span>
      </span>
    );
  }

  if (diffDays === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}>
        <Calendar className="w-3.5 h-3.5 text-amber-600" />
        <span>Due today</span>
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <Calendar className="w-3.5 h-3.5 text-amber-500" />
        <span>Due in {diffDays} day{diffDays !== 1 ? 's' : ''}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      <Calendar className="w-3.5 h-3.5 text-slate-500" />
      <span>Due in {diffDays} days</span>
    </span>
  );
};
