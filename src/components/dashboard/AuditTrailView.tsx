import React from 'react';
import { AuditLog } from '../../types';
import { History, Shield, Clock, ArrowRight } from 'lucide-react';

interface AuditTrailViewProps {
  logs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs }) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'TASK_AUTO_ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'REPORT_VERIFIED':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'DOCTOR_REVIEW_COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REPORT_UPLOADED':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'CARE_PLAN_CREATED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Append-Only Clinical Audit Log
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed and immutable history of state changes, report verifications, and physician sign-offs.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {logs.length} Total Audit Records
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {logs.map(log => (
            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 capitalize">({log.actorRole})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </p>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Target: {log.entityType} ({log.entityId})</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{log.previousState}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold">{log.newState}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
