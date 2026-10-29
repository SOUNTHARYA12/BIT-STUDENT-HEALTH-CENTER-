import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { QueueDoctorStatus, Appointment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Radio,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Volume2,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';

export const LiveQueue: React.FC = () => {
  const { user } = useAuth();
  const [queueList, setQueueList] = useState<QueueDoctorStatus[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = async () => {
    try {
      const [queueData, apptsData] = await Promise.all([
        apiFetch<QueueDoctorStatus[]>('/api/queue/live'),
        apiFetch<Appointment[]>('/api/appointments'),
      ]);
      setQueueList(queueData);
      setMyAppointments(apptsData);
    } catch (err) {
      console.error('Failed to load queue data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 4000); // 4s real-time refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await apiFetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_in' }),
      });
      await loadQueue();
    } catch (err) {
      console.error('Check-in error:', err);
    }
  };

  const myActiveAppt = myAppointments.find(a => ['booked', 'checked_in', 'in_consultation'].includes(a.status));

  return (
    <div className="space-y-6">
      
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
            <h1 className="text-xl font-bold text-[#0f2942]">Live OPD Queue & Token Board</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time consultation status across all campus health center consultation rooms.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Student Personal Token Alert Card */}
      {myActiveAppt && (
        <div className={`p-6 rounded-xl border shadow-xs transition ${
          myActiveAppt.status === 'in_consultation'
            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40 animate-pulse'
            : 'bg-[#0f2942] text-white border-slate-700'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className={`w-4 h-4 ${myActiveAppt.status === 'in_consultation' ? 'text-amber-600' : 'text-teal-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  myActiveAppt.status === 'in_consultation' ? 'text-amber-800' : 'text-teal-300'
                }`}>
                  {myActiveAppt.status === 'in_consultation' ? 'TOKEN CALLED — PLEASE ENTER OPD' : 'YOUR APPOINTMENT TOKEN'}
                </span>
              </div>
              <h2 className={`text-2xl font-black ${myActiveAppt.status === 'in_consultation' ? 'text-amber-950' : 'text-white'}`}>
                Token #{myActiveAppt.token_number}
              </h2>
              <p className={`text-xs mt-1 ${myActiveAppt.status === 'in_consultation' ? 'text-amber-900' : 'text-slate-300'}`}>
                Consulting Physician: <strong>{myActiveAppt.doctor_name}</strong> • {myActiveAppt.doctor_room || 'Room 101'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {myActiveAppt.status === 'booked' && (
                <button
                  onClick={() => handleCheckIn(myActiveAppt.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Check In at Health Desk</span>
                </button>
              )}

              {myActiveAppt.status === 'checked_in' && (
                <div className="px-3 py-1.5 bg-slate-800 text-teal-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span>Checked In • Waiting in Hall</span>
                </div>
              )}

              {myActiveAppt.status === 'in_consultation' && (
                <div className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span>Doctor is Calling Token #{myActiveAppt.token_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OPD Rooms Queue Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading live queue status...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {queueList.map((docQueue) => (
            <div
              key={docQueue.doctorId}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
            >
              {/* Doctor OPD Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                    {docQueue.opdRoom}
                  </span>
                  <h3 className="text-sm font-bold text-[#0f2942]">{docQueue.doctorName}</h3>
                  <div className="text-xs text-slate-500">{docQueue.specialization}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Today's Total</span>
                  <span className="text-sm font-bold text-slate-800">{docQueue.totalToday} Tokens</span>
                </div>
              </div>

              {/* Current Serving Big Display */}
              <div className="p-6 text-center border-b border-slate-100 bg-linear-to-b from-white to-slate-50/40">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Now Attending
                </span>
                {docQueue.currentlyServingToken ? (
                  <div>
                    <div className="text-4xl font-extrabold text-[#0f2942] tracking-tight">
                      Token #{docQueue.currentlyServingToken}
                    </div>
                    <div className="text-xs text-teal-700 font-medium mt-1">
                      Patient: {docQueue.currentlyServingPatient}
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="text-2xl font-bold text-slate-400">No Patient in OPD</div>
                    <div className="text-xs text-slate-500 mt-0.5">Doctor is ready for next token</div>
                  </div>
                )}
              </div>

              {/* Statistics & Waiting Count */}
              <div className="p-4 grid grid-cols-3 gap-2 text-center text-xs bg-white border-b border-slate-100">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Waiting</span>
                  <span className="font-bold text-amber-700 text-sm">{docQueue.waitingCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                  <span className="font-bold text-emerald-700 text-sm">{docQueue.completedCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Est. Wait</span>
                  <span className="font-bold text-slate-700 text-sm">~{docQueue.waitingCount * 12} min</span>
                </div>
              </div>

              {/* Queue List of Tokens */}
              <div className="p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Today's Patient Queue Line
                </div>
                {docQueue.allTokens.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No appointments booked today</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {docQueue.allTokens.map((t) => (
                      <div
                        key={t.id}
                        className={`py-2 px-2 flex items-center justify-between text-xs rounded-md ${
                          t.status === 'in_consultation'
                            ? 'bg-amber-50 font-semibold text-amber-900'
                            : t.student_roll === user?.register_number
                            ? 'bg-teal-50 font-bold text-teal-900'
                            : 'text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">#{t.token_number}</span>
                          <span>{t.student_name}</span>
                          {t.student_roll === user?.register_number && (
                            <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">{t.time_slot}</span>
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-medium ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'in_consultation'
                              ? 'bg-amber-100 text-amber-800'
                              : t.status === 'checked_in'
                              ? 'bg-indigo-100 text-indigo-800'
                              : t.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 line-through'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
