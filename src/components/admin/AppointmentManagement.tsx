import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  CalendarCheck,
  Search,
  Clock,
  MapPin,
  Video,
  Filter,
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>('/api/appointments');
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusOverride = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadAppointments();
    } catch (err) {
      console.error('Status override failed:', err);
    }
  };

  const filtered = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.student_name?.toLowerCase().includes(search.toLowerCase()) && !a.doctor_name?.toLowerCase().includes(search.toLowerCase()) && !a.appointment_number?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Central Appointment Oversight</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor institutional OPD slot allocations, consultation modes, and queue progressions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, doctor, or reference..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading appointment records...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No appointments found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Token & Ref</th>
                <th className="px-4 py-3">Student Patient</th>
                <th className="px-4 py-3">Consulting Doctor</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#0f2942] block">Tk #{a.token_number}</span>
                    <span className="text-[10px] font-mono text-slate-400">{a.appointment_number}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{a.student_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{a.student_roll}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{a.doctor_name}</div>
                    <div className="text-[11px] text-teal-800">{a.doctor_specialization}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{a.appointment_date}</div>
                    <div className="text-[11px] font-mono text-slate-500">{a.time_slot}</div>
                  </td>

                  <td className="px-4 py-3">
                    {a.consultation_type === 'online' ? (
                      <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                        <Video className="w-3.5 h-3.5" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" /> In-Person
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} size="sm" />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusOverride(a.id, e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-medium"
                    >
                      <option value="booked">Booked</option>
                      <option value="checked_in">Checked In</option>
                      <option value="in_consultation">In Consultation</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
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
