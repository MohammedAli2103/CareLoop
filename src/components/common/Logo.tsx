import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', to = '/', className = '' }) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-slate-900 group ${className}`}>
      <div className={`${iconSize} rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 p-1 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10" />
          <path d="M7 12h10" />
        </svg>
      </div>
      <span className={`${textSize} font-extrabold tracking-tight text-slate-900`}>
        Care<span className="text-sky-600">Loop</span>
      </span>
    </Link>
  );
};
