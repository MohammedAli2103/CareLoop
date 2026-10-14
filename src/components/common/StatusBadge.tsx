import React from 'react';
import type { UserStatus } from '../../lib/types';

interface StatusBadgeProps {
  status: UserStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'suspended':
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20';
    }
  };

  const getLabel = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ring-1 ring-inset capitalize ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {getLabel()}
    </span>
  );
};
