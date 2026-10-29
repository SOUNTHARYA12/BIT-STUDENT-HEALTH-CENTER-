import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  MapPin,
  Video,
  Stethoscope,
  CheckCircle,
} from 'lucide-react';

export const DoctorAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
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

  const filtered = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.student_name?.toLowerCase().includes(search.toLowerCase()) && !a.student_roll?.toLowerCase().includes(search.toLowerCase()) && !a.appointment_number?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Physician Appointment Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of in-person OPD visits and scheduled teleconsultation appointments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or roll no..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'all', label: 'All Records' },
          { key: 'checked_in', label: 'Checked In / Waiting' },
          { key: 'in_consultation', label: 'In Consultation' },
          { key: 'booked', label: 'Booked' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-[#0f2942] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No appointments found matching current filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Token & Ref</th>
                <th className="px-4 py-3">Patient / Roll</th>
                <th className="px-4 py-3">Department & Year</th>
                <th className="px-4 py-3">Date & Slot</th>
                <th className="px-4 py-3">Consultation Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#0f2942] block">Tk #{appt.token_number}</span>
                    <span className="text-[10px] font-mono text-slate-400">{appt.appointment_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{appt.student_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{appt.student_roll}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{appt.student_department || 'Student'}</div>
                    <div className="text-[11px] text-slate-400">{appt.student_year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{appt.appointment_date}</div>
                    <div className="text-[11px] font-mono text-teal-700">{appt.time_slot}</div>
                  </td>
                  <td className="px-4 py-3">
                    {appt.consultation_type === 'online' ? (
                      <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                        <Video className="w-3.5 h-3.5" /> Online Video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" /> In-Person OPD
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {['checked_in', 'in_consultation', 'booked'].includes(appt.status) && (
                        <button
                          onClick={() => navigate(`/doctor/workspace?apptId=${appt.id}`)}
                          className="px-2.5 py-1 bg-[#0f2942] hover:bg-[#163654] text-white rounded font-medium transition"
                        >
                          Workspace
                        </button>
                      )}
                      {appt.consultation_type === 'online' && (
                        <Link
                          to="/doctor/teleconsultation"
                          className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                          title="Open Telehealth Room"
                        >
                          <Video className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
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
