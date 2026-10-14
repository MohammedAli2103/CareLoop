import React from 'react';
import { Link } from 'react-router-dom';
import { PortalLayout } from '../components/layout/PortalLayout';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <PortalLayout maxWidth="max-w-md">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500 mt-2">
          The requested page could not be located on the CareLoop healthcare portal.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 py-2.5 px-5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Role Selection</span>
        </Link>
      </div>
    </PortalLayout>
  );
};
