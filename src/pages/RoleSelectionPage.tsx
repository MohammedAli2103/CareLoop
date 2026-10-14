import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { User, Stethoscope, ClipboardList, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'patient',
      title: 'Patient',
      description: 'Access your care plan, reports and updates.',
      icon: User,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      path: '/patient/login',
      accentColor: 'border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-500/5',
    },
    {
      id: 'doctor',
      title: 'Doctor',
      description: 'Manage patients, reports and care plans.',
      icon: Stethoscope,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50 border-sky-100',
      btnBg: 'bg-sky-600 hover:bg-sky-700 text-white',
      path: '/doctor/login',
      accentColor: 'border-sky-200 hover:border-sky-400 hover:shadow-sky-500/5',
    },
    {
      id: 'coordinator',
      title: 'Care Coordinator',
      description: 'Track tasks, verify reports and support patients.',
      icon: ClipboardList,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      path: '/coordinator/login',
      accentColor: 'border-amber-200 hover:border-amber-400 hover:shadow-amber-500/5',
    },
    {
      id: 'administrator',
      title: 'Administrator',
      description: 'Approve staff access, manage users and logs.',
      icon: Shield,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-100',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      path: '/admin/login',
      accentColor: 'border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-500/5',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <span className="text-xs md:text-sm font-medium text-slate-400">
            Your Care Journey, Our Support
          </span>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-8 md:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Role Selector Cards */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome to Care<span className="text-sky-600">Loop</span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg mt-2">
                Choose your role to continue
              </p>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => navigate(role.path)}
                    className={`bg-white rounded-2xl p-6 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between cursor-pointer group ${role.accentColor}`}
                  >
                    <div>
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${role.iconBg} ${role.iconColor}`}>
                        <Icon className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mb-1">
                        {role.title}
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                        {role.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(role.path);
                      }}
                      className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${role.btnBg}`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Healthcare Illustration & Trust Panel */}
          <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md bg-gradient-to-br from-sky-50 via-teal-50/50 to-indigo-50/30 rounded-3xl p-8 border border-sky-100/70 shadow-sm overflow-hidden text-center">
              {/* Decorative Pulse badges */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-sky-100 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-700">HIPAA Compliant</span>
              </div>

              {/* Doctor illustration vector representation */}
              <div className="w-44 h-44 mx-auto my-6 relative flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-sky-400/20 to-teal-400/20 absolute -inset-1 blur-lg"></div>
                <div className="w-36 h-36 rounded-full bg-white shadow-md border border-sky-100 flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-inner">
                    <Stethoscope className="w-12 h-12" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Unified Healthcare Ecosystem
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed px-4">
                Connecting patients, physicians, and care coordinators with enterprise-grade security and automated oversight.
              </p>

              <div className="mt-6 pt-6 border-t border-sky-100/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">24/7</div>
                  <div className="text-[10px] text-slate-400 font-medium">Care Access</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-sky-600">100%</div>
                  <div className="text-[10px] text-slate-400 font-medium">Staff Verified</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-emerald-600">End-to-End</div>
                  <div className="text-[10px] text-slate-400 font-medium">Encrypted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        <p className="font-medium">CareLoop Healthcare Platform — Better coordination. Healthier tomorrow.</p>
      </footer>
    </div>
  );
};
