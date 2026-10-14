import React from 'react';
import { Navbar } from './Navbar';

interface PortalLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  maxWidth?: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  showBack = false,
  backTo = '/',
  maxWidth = 'max-w-6xl',
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navbar showBack={showBack} backTo={backTo} />
      <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {children}
      </main>
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        <p className="font-medium">CareLoop Healthcare Platform — Better coordination. Healthier tomorrow.</p>
      </footer>
    </div>
  );
};
