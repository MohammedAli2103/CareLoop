import React from 'react';
import { UserRole } from '../../types';
import { CareLoopLogo } from './CareLoopLogo';
import { 
  Home, 
  Calendar, 
  FileText, 
  Bell, 
  HelpCircle, 
  Users, 
  Settings, 
  CheckSquare, 
  X,
  Heart,
  MessageSquare
} from 'lucide-react';

interface AppSidebarProps {
  currentRole: UserRole;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNotifications?: () => void;
  onOpenHelp?: () => void;
  unreadNotificationsCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentRole,
  currentTab,
  onTabChange,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onOpenNotifications,
  onOpenHelp,
  unreadNotificationsCount = 3
}) => {
  // Navigation structure per role matching the reference designs
  const patientNav = [
    { id: 'patient-home', label: 'Home', icon: Home },
    { id: 'patient-plan', label: 'My Care Plan', icon: Calendar },
    { id: 'patient-reports', label: 'My Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount || 3 },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const doctorNav = [
    { id: 'doctor-dashboard', label: 'Dashboard', icon: Home },
    { id: 'doctor-patients', label: 'My Patients', icon: Users },
    { id: 'doctor-plans', label: 'Care Plans', icon: Calendar },
    { id: 'doctor-reports', label: 'Reports to Review', icon: FileText, badge: 4 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const coordinatorNav = [
    { id: 'coord-dashboard', label: 'Dashboard', icon: Home },
    { id: 'coord-tasks', label: 'Tasks', icon: CheckSquare, badge: 8 },
    { id: 'coord-verification', label: 'Report Verification', icon: FileText },
    { id: 'coord-patients', label: 'Patients', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 5 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentNav = 
    currentRole === 'patient' 
      ? patientNav 
      : currentRole === 'doctor' 
        ? doctorNav 
        : coordinatorNav;

  const handleNavClick = (itemId: string) => {
    if (itemId === 'notifications') {
      if (onOpenNotifications) onOpenNotifications();
    } else if (itemId === 'help') {
      if (onOpenHelp) onOpenHelp();
    } else if (itemId === 'doctor-reports') {
      onTabChange('doctor-dashboard');
    } else if (itemId === 'coord-patients') {
      onTabChange('coord-dashboard');
    } else if (itemId === 'settings') {
      // Default to main dashboard or settings
      onTabChange(currentRole === 'patient' ? 'patient-home' : currentRole === 'doctor' ? 'doctor-dashboard' : 'coord-dashboard');
    } else {
      onTabChange(itemId);
    }
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        {/* Brand header */}
        <div className="flex h-20 items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100">
          <CareLoopLogo iconOnly={isCollapsed} />

          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1 px-3.5 py-4">
          {currentNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#eef5fc] text-[#1e60d5]'
                    : 'text-[#475569] hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#1e60d5]' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1.5 text-[11px] font-bold text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Illustration & Support Card */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-[#f0f8ff] to-[#e6f4fe] border border-blue-100/60 shadow-2xs">
          <div className="flex flex-col items-center text-center">
            {/* Illustrated avatar with badge */}
            <div className="relative mb-2">
              {currentRole === 'patient' ? (
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-white shadow-xs overflow-hidden flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                      alt="Sarah Khan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#06b6d4] text-white flex items-center justify-center border-2 border-white shadow-xs">
                    <Heart className="w-3.5 h-3.5 fill-white" />
                  </div>
                </div>
              ) : currentRole === 'doctor' ? (
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-white shadow-xs overflow-hidden flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
                      alt="Dr. Mehta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#3b82f6] text-white flex items-center justify-center border-2 border-white shadow-xs">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-cyan-100 border-2 border-white shadow-xs overflow-hidden flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                      alt="Nida Ali"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00b4d8] text-white flex items-center justify-center border-2 border-white shadow-xs">
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  </div>
                </div>
              )}
            </div>

            <h4 className="text-sm font-bold text-[#0f172a]">
              {currentRole === 'patient' ? 'Need help?' : 'Need Help?'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug px-1">
              {currentRole === 'patient'
                ? "We're here to support your care journey."
                : 'Quick guides and support for using CareLoop.'}
            </p>

            <button
              onClick={onOpenHelp}
              className="mt-3.5 w-full py-2 px-3 text-xs font-semibold text-[#1e60d5] bg-white hover:bg-blue-50/80 border border-[#b9d5fc] rounded-xl shadow-2xs transition-colors"
            >
              {currentRole === 'patient' ? 'Contact Support' : 'View Help Center'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200/90 bg-white transition-all duration-200 lg:block ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
