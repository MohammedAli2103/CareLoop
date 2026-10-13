import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  showBack?: boolean;
  backTo?: string;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ showBack = false, backTo = '/' }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <span className="hidden md:inline-block text-xs font-medium text-slate-400 border-l border-slate-200 pl-4 py-1">
            Your Care Journey, Our Support
          </span>
        </div>

        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </Link>
          )}

          {user || profile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {profile?.full_name || 'CareLoop User'}
                </span>
                <span className="text-[11px] font-medium text-sky-600 capitalize">
                  {profile?.role || 'Member'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Change Role
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
