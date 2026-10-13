import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'brand' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
  className = ''
}) => {
  const variantStyles = {
    default: {
      card: 'bg-white border-slate-200/80 hover:border-slate-300',
      iconBox: 'bg-slate-100 text-slate-700',
      value: 'text-slate-900',
    },
    brand: {
      card: 'bg-white border-teal-200/90 hover:border-teal-300',
      iconBox: 'bg-teal-50 text-teal-700',
      value: 'text-teal-900',
    },
    warning: {
      card: 'bg-white border-amber-200/90 hover:border-amber-300',
      iconBox: 'bg-amber-50 text-amber-700',
      value: 'text-amber-900',
    },
    danger: {
      card: 'bg-rose-50/50 border-rose-200 hover:border-rose-300',
      iconBox: 'bg-rose-100 text-rose-700',
      value: 'text-rose-900',
    },
    success: {
      card: 'bg-white border-emerald-200/90 hover:border-emerald-300',
      iconBox: 'bg-emerald-50 text-emerald-700',
      value: 'text-emerald-900',
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl border shadow-xs transition-all duration-200 ${currentVariant.card} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${currentVariant.value}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${currentVariant.iconBox}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
