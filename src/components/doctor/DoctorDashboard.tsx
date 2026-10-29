import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Radio,
  CalendarCheck,
  Clock,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Video,
  UserCheck,
  AlertCircle,
  Play,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const docProfile = profile as any;

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayData();
    const timer = setInterval(() => {
      loadTodayDataSilently();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayDataSilently = async () => {
    try {
      const data = await apiFetch<Appointment[]>(`/api/appointments?date=${todayStr}`);
      setTodayAppointments(data);
    } catch {}
  };

  const loadTodayData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>(`/api/appointments?date=${todayStr}`);
      setTodayAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentlyAttending = todayAppointments.find(a => a.status === 'in_consultation');
  const waitingPatients = todayAppointments.filter(a => ['checked_in', 'booked'].includes(a.status));
  const completedCount = todayAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = todayAppointments.filter(a => a.status === 'cancelled').length;

  const handleMarkCompleted = async (apptId: string) => {
    try {
      await apiFetch(`/api/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      });
      setTodayAppointments(prev =>
        prev.map(a => a.id === apptId ? { ...a, status: 'completed' } : a)
      );
      await loadTodayDataSilently();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
    }
  };

  const handleCallNext = async () => {
    if (waitingPatients.length === 0) return;
    setCallingNext(true);

    try {
      const nextPatient = waitingPatients[0];
      await apiFetch(`/api/appointments/${nextPatient.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_consultation' }),
      });
      await loadTodayData();
      navigate(`/doctor/workspace?apptId=${nextPatient.id}`);
    } catch (err) {
      console.error('Failed to call next:', err);
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-[#DCE5EE] p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#008780] uppercase tracking-wider">
                Physician OPD Workspace
              </span>
              <span className="text-[#DCE5EE]">•</span>
              <span className="text-xs text-[#657D96]">{docProfile?.opd_room || 'Room 101, Ground Floor'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142F49]">
              {user?.name}
            </h1>
            <p className="text-xs text-[#657D96] mt-1">
              Specialization: <strong className="text-[#142F49]">{docProfile?.specialization || 'General Medicine'}</strong> • Timings: {docProfile?.start_time || '08:30'} - {docProfile?.end_time || '17:30'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCallNext}
              disabled={callingNext || waitingPatients.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{callingNext ? 'Calling...' : `Call Next Token (${waitingPatients.length} waiting)`}</span>
            </button>
            <Link
              to="/doctor/workspace"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#142F49] hover:bg-[#1C3E60] text-white text-xs font-semibold rounded-xl transition"
            >
              <Stethoscope className="w-4 h-4 text-teal-300" />
              <span>Clinical Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Total Registered Today</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">
            {todayAppointments.length}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            Scheduled slots for {todayStr}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">In Waiting Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 tabular-nums">
            {waitingPatients.length}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            {todayAppointments.filter(a => a.status === 'checked_in').length} already checked-in in waiting hall
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Consultations Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
            {completedCount}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            Rx issued & synced with BIT Pharmacy
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Now Attending</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">
            {currentlyAttending ? `#${currentlyAttending.token_number}` : 'None'}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1 truncate">
            {currentlyAttending ? currentlyAttending.student_name : 'OPD is currently idle'}
          </div>
        </div>

      </div>

      {/* Main Grid: Currently Attending & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#008780]" />
              <h2 className="text-sm font-bold text-[#142F49]">Today's Scheduled OPD Patients</h2>
            </div>
            <Link to="/doctor/appointments" className="text-xs text-[#008780] hover:text-[#007C76] font-semibold flex items-center gap-1">
              Full schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#657D96]">Loading today's schedule...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#657D96]">No appointments scheduled for today.</div>
          ) : (
            <div className="divide-y divide-[#DCE5EE]/60">
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`py-3.5 px-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    appt.status === 'in_consultation' ? 'bg-[#EAF3FA] border border-[#008780]/30' : 'hover:bg-[#F5F8FA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF3FA] border border-[#DCE5EE] text-[#008780] flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[8px] uppercase text-[#008780] font-bold">Tk</span>
                      <span className="text-xs font-black">#{appt.token_number}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#142F49]">{appt.student_name}</span>
                        <span className="text-[10px] font-mono text-[#657D96]">({appt.student_roll})</span>
                      </div>
                      <div className="text-xs text-[#657D96] truncate max-w-sm mt-0.5">
                        {appt.reason_for_visit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right text-xs">
                      <div className="font-mono font-medium text-[#142F49]">{appt.time_slot}</div>
                      <div className="text-[10px] text-[#657D96] capitalize">{appt.consultation_type.replace('_', ' ')}</div>
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                    
                    {['checked_in', 'in_consultation', 'booked'].includes(appt.status) && (
                      <Link
                        to={`/doctor/workspace?apptId=${appt.id}`}
                        className="px-3 py-1 bg-[#142F49] hover:bg-[#1C3E60] text-white text-xs font-semibold rounded-lg transition"
                      >
                        {appt.status === 'in_consultation' ? 'Attend' : 'Open'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Active Patient Details Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#142F49] uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#008780]" />
              <span>Current OPD Consultation</span>
            </h3>

            {currentlyAttending ? (
              <div className="p-4 bg-[#EAF3FA]/60 rounded-xl border border-[#008780]/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-[#142F49]">Token #{currentlyAttending.token_number}</span>
                  <StatusBadge status="in_consultation" size="sm" />
                </div>
                <div>
                  <div className="text-[10px] text-[#657D96] uppercase font-semibold">Student Name</div>
                  <div className="font-bold text-sm text-[#142F49]">{currentlyAttending.student_name}</div>
                  <div className="text-xs text-[#657D96] font-mono">Roll: {currentlyAttending.student_roll}</div>
                  <div className="text-xs text-[#657D96]">Dept: {currentlyAttending.student_department} ({currentlyAttending.student_year})</div>
                  <div className="text-xs text-rose-700 font-medium mt-0.5">Blood Group: {currentlyAttending.student_blood_group || 'O+'}</div>
                </div>

                <div className="pt-2 border-t border-[#DCE5EE]">
                  <div className="text-[10px] text-[#657D96] uppercase font-semibold">Reported Symptoms</div>
                  <p className="text-xs text-[#142F49] mt-0.5 italic">
                    "{currentlyAttending.reason_for_visit}"
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(currentlyAttending.id)}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Mark Consultation Completed</span>
                  </button>
                  <Link
                    to={`/doctor/workspace?apptId=${currentlyAttending.id}`}
                    className="w-full py-2 bg-[#142F49] hover:bg-[#1C3E60] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <span>Open Clinical Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-[#F5F8FA] rounded-xl border border-dashed border-[#DCE5EE]">
                <p className="text-xs text-[#657D96]">No active consultation in progress.</p>
                <button
                  onClick={handleCallNext}
                  disabled={waitingPatients.length === 0}
                  className="mt-3 px-3.5 py-1.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-xl transition disabled:opacity-40 cursor-pointer"
                >
                  Call Next Patient
                </button>
              </div>
            )}
          </div>

          {/* Quick Teleconsultation Banner */}
          <div className="bg-[#142F49] text-white rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-sm">Telehealth & Online Video OPD</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Conduct remote consultations with hostel students and off-campus faculty using encrypted peer teleconsultation.
            </p>
            <Link
              to="/doctor/teleconsultation"
              className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 font-semibold"
            >
              <span>Open Online Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
