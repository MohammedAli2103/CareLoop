import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminService } from '../../services/adminService';
import type { AuditLog } from '../../lib/types';
import {
  Search,
  Filter,
  RefreshCw,
  Shield,
  Loader2,
  FileCode,
} from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRecentActivity(50);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(q);
      const actorMatch = (log.actor_email || log.actor_role || '').toLowerCase().includes(q);
      const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return actionMatch || actorMatch || detailsMatch;
    }
    return true;
  });

  return (
    <AdminLayout
      title="Activity & Audit Logs"
      subtitle="Immutable trail of administrative approvals, logins, profile modifications, and security events."
    >
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search actions or actors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Event:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Events</option>
                <option value="APPROVED">Staff Approvals</option>
                <option value="REJECTED">Staff Rejections</option>
                <option value="REGIST">Registrations</option>
                <option value="OTP">OTP & 2FA Events</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Target / Summary</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                      Retrieving audit stream...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No audit events match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            log.action.includes('APPROVED')
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.action.includes('REJECTED')
                              ? 'bg-rose-50 text-rose-700'
                              : log.action.includes('OTP')
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {log.actor_email || log.actor_role || 'System'}
                        </span>
                        {log.actor_role && (
                          <span className="text-[10px] text-slate-400 block capitalize">
                            Role: {log.actor_role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate">
                        {log.details?.name ||
                          log.details?.target_name ||
                          log.details?.email ||
                          log.target_type ||
                          'System operation'}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                          title="View JSON Payload"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: JSON Payload Inspection */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-slate-900">Audit Record #{selectedLog.id.slice(0, 8)}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs mb-2 text-slate-500">
                  Action: <strong className="font-mono text-slate-900">{selectedLog.action}</strong>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
