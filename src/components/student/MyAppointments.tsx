import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  MapPin,
  Clock,
  Radio,
  XCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar,
} from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    const timer = setInterval(() => {
      fetchAppointmentsSilently();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointmentsSilently = async () => {
    try {
      const data = await apiFetch<Appointment[]>('/api/appointments');
      setAppointments(data);
    } catch {}
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>('/api/appointments');
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setActionMsg({ text: err.message || 'Unable to load appointments.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionMsg(null);
    try {
      const res = await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      // Immediately update in-memory state
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
      );
      setActionMsg({ text: res.message || `Appointment status updated to ${newStatus}.`, type: 'success' });
      await fetchAppointmentsSilently();
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Status update failed.', type: 'error' });
    }
  };

  const handleOpenCancelModal = (appt: Appointment) => {
    if (appt.status === 'completed') {
      setActionMsg({ text: 'Cannot cancel an appointment that has already been completed.', type: 'error' });
      return;
    }
    if (appt.status === 'cancelled') {
      setActionMsg({ text: 'This appointment is already cancelled.', type: 'error' });
      return;
    }
    if (appt.status === 'in_consultation') {
      setActionMsg({ text: 'Cannot cancel an appointment currently in consultation with the doctor.', type: 'error' });
      return;
    }
    setCancelTarget(appt);
    setCancelModalError(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    setCancelModalError(null);

    try {
      const res = await apiFetch(`/api/appointments/${cancelTarget.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });

      // Immediately update local state without requiring manual page reload
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
      );

      setActionMsg({
        text: `Appointment #${cancelTarget.appointment_number} with ${cancelTarget.doctor_name} has been cancelled. Your time slot (${cancelTarget.time_slot}) has been released for other students.`,
        type: 'success',
      });

      setCancelTarget(null);
      await fetchAppointmentsSilently();
    } catch (err: any) {
      setCancelModalError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">My Medical Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review past consultations, upcoming bookings, queue tokens, and manage appointment cancellations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAppointments()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/student/book"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>Book New Appointment</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'all', label: 'All Appointments', count: appointments.length },
          { key: 'booked', label: 'Booked', count: appointments.filter((a) => a.status === 'booked').length },
          { key: 'checked_in', label: 'Checked In', count: appointments.filter((a) => a.status === 'checked_in').length },
          { key: 'completed', label: 'Completed', count: appointments.filter((a) => a.status === 'completed').length },
          { key: 'cancelled', label: 'Cancelled', count: appointments.filter((a) => a.status === 'cancelled').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#142F49] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-700">No appointments found</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {filterStatus === 'all'
              ? 'You have not booked any appointments yet.'
              : `You have no records under the "${filterStatus.replace('_', ' ')}" filter.`}
          </p>
          <Link
            to="/student/book"
            className="mt-3 inline-block px-3.5 py-1.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Book Appointment Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const isCancellable = ['booked', 'checked_in'].includes(appt.status);
            const isCompleted = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';
            const isInConsultation = appt.status === 'in_consultation';

            return (
              <div
                key={appt.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition ${
                  isCancelled
                    ? 'border-slate-200 bg-slate-50/40 opacity-80'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex flex-col items-center justify-center shrink-0 font-mono">
                      <span className="text-[9px] uppercase font-bold text-teal-600">Token</span>
                      <span className="text-sm font-extrabold text-[#142F49]">#{appt.token_number}</span>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-slate-500">{appt.appointment_number}</span>
                      <h3 className="text-sm font-bold text-slate-900">{appt.doctor_name}</h3>
                      <div className="text-xs text-[#008780] font-medium">{appt.doctor_specialization}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={appt.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs py-3">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Appointment Time</span>
                    <div className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{appt.appointment_date} • {appt.time_slot}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Consultation Location</span>
                    <div className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#008780]" />
                      <span>In-Person OPD ({appt.doctor_room || 'Room 101, Ground Floor'})</span>
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Reason for Consultation</span>
                    <div className="font-semibold text-[#142F49] mt-0.5">
                      "{appt.reason_for_visit}"
                    </div>
                    {appt.symptoms_description && (
                      <div className="text-[11px] text-slate-500 mt-1 italic">
                        Details: {appt.symptoms_description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Booked on {new Date(appt.created_at).toLocaleDateString('en-IN')}
                    {isCancelled && (
                      <span className="ml-2 text-rose-600 font-semibold">• Slot released for other students</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Check In Action */}
                    {appt.status === 'booked' && (
                      <button
                        onClick={() => handleStatusChange(appt.id, 'checked_in')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EAF3FA] text-[#008780] hover:bg-teal-100 border border-[#DCE5EE] rounded-lg font-medium transition cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Check In at Health Center</span>
                      </button>
                    )}

                    {/* Cancel Appointment Action (Works with Confirmation Dialog) */}
                    {isCancellable && (
                      <button
                        onClick={() => handleOpenCancelModal(appt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold transition shadow-2xs cursor-pointer"
                        title="Cancel this appointment and release your time slot"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel Appointment</span>
                      </button>
                    )}

                    {isCompleted && (
                      <Link
                        to="/student/records"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                      >
                        View Medical Summary
                      </Link>
                    )}

                    {isCancelled && (
                      <Link
                        to={`/student/book?doctorId=${appt.doctor_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#008780] rounded-lg font-semibold transition"
                      >
                        Book New Slot
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Appointment Cancellation */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Confirm Appointment Cancellation</h3>
                  <p className="text-[11px] text-slate-500">BIT Student Health Center</p>
                </div>
              </div>
              <button
                onClick={() => !cancelling && setCancelTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                disabled={cancelling}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{cancelModalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to cancel this appointment? This action cannot be undone, and your booked time slot will be released immediately for other students.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Appointment ID:</span>
                  <span className="font-mono font-bold text-[#0f2942]">{cancelTarget.appointment_number}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Token Number:</span>
                  <span className="font-bold text-teal-800">#{cancelTarget.token_number}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Physician:</span>
                  <span className="font-semibold text-slate-900">{cancelTarget.doctor_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-medium text-slate-900">{cancelTarget.appointment_date} at {cancelTarget.time_slot}</span>
                </div>
                <div className="pt-0.5">
                  <span className="text-slate-500 block">Reason for visit:</span>
                  <span className="font-medium text-slate-800 italic">"{cancelTarget.reason_for_visit}"</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Yes, Cancel Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
