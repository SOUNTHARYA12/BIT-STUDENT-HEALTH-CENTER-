import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Play,
  CheckCircle,
  XCircle,
  Stethoscope,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const DoctorQueue: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const docProfile = profile as any;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueueSilently, 4000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const loadQueueSilently = async () => {
    try {
      const data = await apiFetch<Appointment[]>(`/api/appointments?date=${selectedDate}`);
      setAppointments(data);
    } catch {}
  };

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>(`/api/appointments?date=${selectedDate}`);
      setAppointments(data);
    } catch (err: any) {
      console.error('Queue load error:', err);
      setStatusMsg({ text: err.message || 'Failed to load queue data.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    setStatusMsg(null);
    loadQueue();
  };

  const handleUpdateStatus = async (id: string, status: string, openWorkspace = false) => {
    setStatusMsg(null);
    try {
      const res = await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      // Optimistically update local state immediately
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as any } : a))
      );

      setStatusMsg({
        text: res.message || `Appointment status updated to ${status.replace('_', ' ')}.`,
        type: 'success',
      });

      await loadQueueSilently();

      if (openWorkspace) {
        navigate(`/doctor/workspace?apptId=${id}`);
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update appointment status.', type: 'error' });
    }
  };

  // Sort queue strictly by token number then time slot
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.token_number - b.token_number || a.time_slot.localeCompare(b.time_slot)
  );

  const waitingList = sortedAppointments.filter((a) => ['checked_in', 'booked'].includes(a.status));
  const activeInConsult = sortedAppointments.find((a) => a.status === 'in_consultation');
  const completedList = sortedAppointments.filter((a) => a.status === 'completed');
  const cancelledList = sortedAppointments.filter((a) => a.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h1 className="text-xl font-bold text-[#0f2942]">OPD Patient Queue & Token Calling</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily patient queue for <strong>{user?.name}</strong> • {docProfile?.opd_room || 'Room 101, Ground Floor'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-0.5 text-xs text-slate-800 bg-transparent border-0 focus:outline-none font-medium"
            />
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-teal-800 rounded font-semibold text-[10px] transition cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Currently in Consultation Spotlight Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Active Consultation in Progress</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] font-normal">
            OPD Room: {docProfile?.opd_room || 'Room 101, Ground Floor'}
          </span>
        </div>

        {activeInConsult ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-amber-50/70 rounded-xl border border-amber-300">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex flex-col items-center justify-center font-mono shrink-0 shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-amber-700">Token</span>
                <span className="text-xl font-black">#{activeInConsult.token_number}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{activeInConsult.student_name}</h2>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">({activeInConsult.student_roll})</span>
                  <StatusBadge status="in_consultation" size="sm" />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Appt Ref: <strong className="font-mono text-[#0f2942]">{activeInConsult.appointment_number}</strong> • Time: <strong className="font-mono text-teal-800">{activeInConsult.time_slot}</strong>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Dept: {activeInConsult.student_department} ({activeInConsult.student_year}) • Blood: <span className="font-semibold text-rose-700">{activeInConsult.student_blood_group || 'O+'}</span>
                </div>
                <div className="text-xs text-[#0f2942] font-medium mt-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                  <span className="text-slate-500 font-normal">Reason for Consultation: </span>
                  <span className="italic">"{activeInConsult.reason_for_visit}"</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              {/* Mark Consultation Completed Button */}
              <button
                onClick={() => handleUpdateStatus(activeInConsult.id, 'completed')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Mark this consultation as finished and move to completed roster"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Mark Completed</span>
              </button>

              {/* Open Full Clinical Workspace & Rx */}
              <button
                onClick={() => navigate(`/doctor/workspace?apptId=${activeInConsult.id}`)}
                className="px-4 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-teal-300" />
                <span>Clinical Notes & Rx</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-700">No patient is currently in your consultation room.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select any waiting patient below and click <strong>"Call Patient (Start Consultation)"</strong> to invite them in.
            </p>
          </div>
        )}
      </div>

      {/* Queue View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#142F49] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Queue Items</span>
            <span className="text-[10px] opacity-75 font-mono">({appointments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('waiting')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'waiting'
                ? 'bg-[#008780] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Waiting Queue</span>
            <span className="text-[10px] opacity-75 font-mono">({waitingList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Completed</span>
            <span className="text-[10px] opacity-75 font-mono">({completedList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cancelled'
                ? 'bg-rose-700 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Cancelled</span>
            <span className="text-[10px] opacity-75 font-mono">({cancelledList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <h2 className="font-bold text-[#0f2942] uppercase tracking-wider text-[11px]">
              Patient Roster for {selectedDate} ({appointments.length} Total Registered)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Arranged sequentially by assigned Token Number</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading patient queue...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No patients in the queue today.</p>
            <p className="text-slate-400 text-[11px]">
              There are currently no student appointments booked or waiting for this date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedAppointments
              .filter((item) => {
                if (activeTab === 'waiting') return ['checked_in', 'booked'].includes(item.status);
                if (activeTab === 'completed') return item.status === 'completed';
                if (activeTab === 'cancelled') return item.status === 'cancelled';
                return true;
              })
              .map((item) => {
                const isWaiting = ['checked_in', 'booked'].includes(item.status);
                const isCurrent = item.status === 'in_consultation';
                const isDone = item.status === 'completed';
                const isCancelled = item.status === 'cancelled';

                return (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isCurrent
                        ? 'bg-amber-50/60 border-l-4 border-l-amber-500'
                        : isCancelled
                        ? 'bg-slate-50/60 opacity-75'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Token Box */}
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex flex-col items-center justify-center font-mono shrink-0 shadow-2xs">
                        <span className="text-[8px] uppercase font-bold text-teal-600">Token</span>
                        <span className="text-sm font-extrabold text-[#0f2942]">#{item.token_number}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{item.student_name}</span>
                          <span className="text-[10px] font-mono text-slate-500">({item.student_roll})</span>
                          <StatusBadge status={item.status} size="sm" />
                        </div>

                        <div className="text-xs text-slate-600 mt-0.5">
                          Appt Ref: <span className="font-mono text-slate-800">{item.appointment_number}</span> • Time: <strong className="font-mono text-teal-800">{item.time_slot}</strong>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">Reason: </span>
                          <span className="italic">"{item.reason_for_visit}"</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls for Doctor */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isWaiting && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'in_consultation', true)}
                            className="px-3.5 py-1.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title="Call this patient into the consultation room and open workspace"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Call Patient</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(item.id, 'no_show')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg text-xs transition cursor-pointer"
                            title="Mark Patient as Absent / No Show"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {isCurrent && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'completed')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {isDone && (
                        <button
                          onClick={() => navigate(`/doctor/workspace?apptId=${item.id}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                        >
                          View Clinical Summary
                        </button>
                      )}

                      {isCancelled && (
                        <span className="text-[11px] text-rose-600 italic">
                          Slot Released
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Completed Section Overview */}
      {completedList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
            <span className="font-bold text-[#0f2942] uppercase tracking-wider">
              Completed OPD Visits ({completedList.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Date: {selectedDate}</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {completedList.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-[#0f2942]">Token #{c.token_number}</span>
                  <span className="font-semibold text-slate-900 ml-2">{c.student_name}</span>
                  <span className="text-[11px] text-slate-400 font-mono ml-2">({c.appointment_number})</span>
                  <span className="text-[11px] text-slate-500 ml-2">• {c.time_slot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </span>
                  <button
                    onClick={() => navigate(`/doctor/workspace?apptId=${c.id}`)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-medium underline ml-2 cursor-pointer"
                  >
                    View EMR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Section Overview */}
      {cancelledList.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-rose-100 pb-2">
            <span className="font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Cancelled Appointments & Released Slots ({cancelledList.length})</span>
            </span>
            <span className="text-[11px] text-rose-500 font-mono">Not in waiting queue</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {cancelledList.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-400 line-through">Token #{c.token_number}</span>
                  <span className="text-slate-800 ml-2">{c.student_name}</span>
                  <span className="text-[11px] text-slate-400 font-mono ml-2">({c.appointment_number})</span>
                  <span className="text-[11px] text-slate-500 ml-2">• {c.time_slot}</span>
                </div>
                <div>
                  <StatusBadge status="cancelled" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
