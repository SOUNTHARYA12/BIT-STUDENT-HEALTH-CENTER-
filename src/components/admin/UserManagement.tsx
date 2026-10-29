import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { User, UserRole } from '../../types';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Stethoscope,
  Pill,
  GraduationCap,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionMsg(null);
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setActionMsg(`User account status changed to ${nextStatus}.`);
      await loadUsers();
    } catch (err: any) {
      setActionMsg(err.message || 'Status toggle failed.');
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.register_number?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Institutional User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer student profiles, medical officers, pharmacy staff, and institutional access roles.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll no, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-lg">
          {actionMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'all', label: 'All Accounts', count: users.length },
          { key: 'student', label: 'Students', count: users.filter(u => u.role === 'student').length },
          { key: 'doctor', label: 'Doctors', count: users.filter(u => u.role === 'doctor').length },
          { key: 'pharmacy', label: 'Pharmacy Staff', count: users.filter(u => u.role === 'pharmacy').length },
          { key: 'admin', label: 'Administrators', count: users.filter(u => u.role === 'admin').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === tab.key
                ? 'bg-[#0f2942] text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading user catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No user accounts found matching current query.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Role & Identifier</th>
                <th className="px-4 py-3">Academic / OPD Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isActive = u.status === 'active';
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                          <div className="text-[10px] text-slate-400">{u.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        u.role === 'student'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : u.role === 'doctor'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : u.role === 'pharmacy'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {u.role}
                      </span>
                      <div className="font-mono text-[11px] text-slate-600 mt-1">
                        {u.register_number || 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {u.role === 'student' && (
                        <div>
                          <span className="font-medium text-slate-800">{u.department}</span>
                          <div className="text-[11px] text-slate-500">{u.year_of_study} • Blood: <span className="font-semibold text-rose-700">{u.blood_group}</span></div>
                        </div>
                      )}
                      {u.role === 'doctor' && (
                        <div>
                          <span className="font-medium text-teal-800">{u.specialization}</span>
                          <div className="text-[11px] text-slate-500">{u.opd_room}</div>
                        </div>
                      )}
                      {u.role === 'pharmacy' && (
                        <div>Chief Pharmacist • Dispensary Unit</div>
                      )}
                      {u.role === 'admin' && (
                        <div>Health Center Director • Campus Admin</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
