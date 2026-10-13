import React from 'react';

interface CareLoopLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const CareLoopLogo: React.FC<CareLoopLogoProps> = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Cyan CareLoop Icon */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00b4d8] to-[#0096c7] text-white shadow-xs">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
        >
          {/* Stylized speech bubble / care loop */}
          <path
            d="M8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16C24 20.4183 20.4183 24 16 24C14.2 24 12.5 23.4 11.1 22.4L7 24L8.2 20.1C8.07 18.8 8 17.4 8 16Z"
            fill="white"
            fillOpacity="0.25"
          />
          <path
            d="M11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16C21 18.7614 18.7614 21 16 21C14.5 21 13.2 20.3 12.3 19.2L10 20L10.8 17.8C10.3 17.3 11 16 11 16Z"
            fill="white"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="truncate">
          <span className="text-xl font-bold tracking-tight text-[#0f172a] block leading-tight">
            CareLoop
          </span>
          <span className="text-[11px] font-medium text-slate-400 block leading-tight mt-0.5">
            Your Care Journey, Our Support
          </span>
        </div>
      )}
    </div>
  );
};
