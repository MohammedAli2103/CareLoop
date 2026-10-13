import React, { useState, useRef, useEffect } from 'react';
import { UserRole, User, NotificationItem } from '../../types';
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  UserCheck, 
  Stethoscope, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  Smartphone
} from 'lucide-react';

interface AppHeaderProps {
  currentRole: UserRole;
  currentUser: User;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onToggleSidebar: () => void;
  pageTitle: string;
  pageSubtitle?: string;
  onRoleChange: (role: UserRole) => void;
  onSimulateTimeLeap: () => void;
  onResetData: () => void;
  onOpenWhatsApp: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRole,
  currentUser,
  notifications,
  onOpenNotifications,
  onToggleSidebar,
  pageTitle,
  onRoleChange,
  onSimulateTimeLeap,
  onResetData,
  onOpenWhatsApp
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine notification count badge to match images
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const badgeCount = currentRole === 'patient' ? 3 : currentRole === 'doctor' ? 4 : 5;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0f172a]">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          title="CareLoop Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-2xs">
            {unreadCount > 0 ? unreadCount : badgeCount}
          </span>
        </button>

        {/* User Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-[#0f172a] block leading-tight">
                {currentUser.fullName}
              </span>
              <span className="text-xs text-slate-400 font-medium block leading-tight mt-0.5">
                {currentUser.role === 'patient' 
                  ? 'Patient' 
                  : currentUser.role === 'doctor' 
                    ? 'Physician' 
                    : 'Care Coordinator'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-150" />
          </button>

          {/* Interactive Role Switcher & Demo Actions Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Switch Dashboard Persona
                </span>
              </div>

              {/* Roles */}
              <div className="space-y-1 py-1.5">
                <button
                  onClick={() => {
                    onRoleChange('patient');
                    setIsDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentRole === 'patient'
                      ? 'bg-blue-50 text-[#1b64f2]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#1b64f2]" />
                    <div className="text-left">
                      <span className="block font-bold">Sarah Khan</span>
                      <span className="text-[10px] text-slate-500 font-normal">Patient View</span>
                    </div>
                  </div>
                  {currentRole === 'patient' && (
                    <span className="w-2 h-2 rounded-full bg-[#1b64f2]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    onRoleChange('doctor');
                    setIsDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentRole === 'doctor'
                      ? 'bg-blue-50 text-[#1b64f2]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4 text-[#1b64f2]" />
                    <div className="text-left">
                      <span className="block font-bold">Dr. Arjun Mehta</span>
                      <span className="text-[10px] text-slate-500 font-normal">Physician View</span>
                    </div>
                  </div>
                  {currentRole === 'doctor' && (
                    <span className="w-2 h-2 rounded-full bg-[#1b64f2]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    onRoleChange('coordinator');
                    setIsDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentRole === 'coordinator'
                      ? 'bg-blue-50 text-[#1b64f2]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#1b64f2]" />
                    <div className="text-left">
                      <span className="block font-bold">Nida Ali</span>
                      <span className="text-[10px] text-slate-500 font-normal">Care Coordinator View</span>
                    </div>
                  </div>
                  {currentRole === 'coordinator' && (
                    <span className="w-2 h-2 rounded-full bg-[#1b64f2]" />
                  )}
                </button>
              </div>

              {/* Hackathon Demo Shortcuts */}
              <div className="pt-2 mt-1 border-t border-slate-100">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Demo Interactive Controls
                </span>

                <button
                  onClick={() => {
                    onSimulateTimeLeap();
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-700 hover:bg-rose-50 font-medium transition-colors"
                >
                  <Zap className="w-4 h-4 text-rose-600" />
                  <span>Simulate Overdue SLA (+48h)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenWhatsApp();
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Simulated WhatsApp Notice</span>
                </button>

                <button
                  onClick={() => {
                    onResetData();
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
