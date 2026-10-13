import React from 'react';
import { TaskStatus, VerificationStatus } from '../../types';
import { Clock, AlertTriangle, CheckCircle2, ShieldCheck, FileCheck2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | VerificationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'To Do'
        };
      case 'In Progress':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200/80',
          dot: 'bg-sky-500',
          icon: FileCheck2,
          label: 'Report Submitted'
        };
      case 'Overdue':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-600',
          icon: AlertTriangle,
          label: 'Overdue'
        };
      case 'Verified':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          dot: 'bg-indigo-600',
          icon: CheckCircle2,
          label: 'Waiting for Doctor'
        };
      case 'Resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-600',
          icon: ShieldCheck,
          label: 'All Steps Completed'
        };
      case 'Unverified':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Clock,
          label: 'Report Needs Checking'
        };
      case 'Flagged':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          label: 'Needs Correction'
        };
      case 'Active':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          icon: Clock,
          label: 'Active'
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
          label: 'All Steps Completed'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Clock,
          label: status
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs tracking-tight ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
