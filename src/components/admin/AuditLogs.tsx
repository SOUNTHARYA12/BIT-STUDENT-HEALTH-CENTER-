import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Database,
  RefreshCw,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AuditLog[]>('/api/admin/audit-logs?limit=100');
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <h1 className="text-xl font-bold text-[#0f2942]">System Audit & Compliance Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all user logins, appointment bookings, clinical diagnoses, and pharmacy dispensations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs by action or user..."
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-64"
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading audit log trail...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No audit records found matching search filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Entity Domain</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{log.user_name || 'System'}</div>
                    <div className="text-[10px] text-teal-800 uppercase font-semibold">{log.user_role || 'System'}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-xs text-[#0f2942] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                    {log.entity_type} {log.entity_id ? `(#${log.entity_id.substring(0, 10)})` : ''}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {log.details || 'Operational record recorded.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
