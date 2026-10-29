import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import {
  CalendarCheck,
  Stethoscope,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DoctorItem {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  opd_room: string;
  experience_years: number;
  avatar_url: string;
  start_time: string;
  end_time: string;
  role_title?: string;
  consultation_timings?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason: string;
}

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryDoctorId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Format today as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const consultationType = 'in_person'; // Strictly in-person consultations
  
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successAppt, setSuccessAppt] = useState<any | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (queryDoctorId && doctors.some(d => d.id === queryDoctorId)) {
      setSelectedDoctorId(queryDoctorId);
    }
  }, [queryDoctorId, doctors]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await apiFetch<DoctorItem[]>('/api/doctors');
      setDoctors(data);
      if (data.length > 0) {
        const initialDoc = queryDoctorId && data.some(d => d.id === queryDoctorId) ? queryDoctorId : data[0].id;
        setSelectedDoctorId(initialDoc);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchSlots(selectedDoctorId, selectedDate);
      const timer = setInterval(() => {
        fetchSlotsSilently(selectedDoctorId, selectedDate);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchSlotsSilently = async (docId: string, date: string) => {
    try {
      const res = await apiFetch<{ slots: TimeSlot[] }>(`/api/doctors/${docId}/available-slots?date=${date}`);
      setSlots(res.slots || []);
    } catch {}
  };

  const fetchSlots = async (docId: string, date: string) => {
    setLoadingSlots(true);
    setSelectedSlot('');
    try {
      const res = await apiFetch<{ slots: TimeSlot[] }>(`/api/doctors/${docId}/available-slots?date=${date}`);
      setSlots(res.slots || []);
      // Auto-select first available slot
      const firstOpen = res.slots?.find(s => s.available);
      if (firstOpen) {
        setSelectedSlot(firstOpen.time);
      }
    } catch (err) {
      console.error('Failed to load time slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available appointment time slot.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a clear primary reason for your visit.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          appointment_date: selectedDate,
          time_slot: selectedSlot,
          consultation_type: 'in_person',
          reason_for_visit: reason.trim(),
          symptoms_description: symptoms.trim() || null,
        }),
      });

      setSuccessAppt({
        ...res.appointment,
        doctor_name: selectedDoctor?.name || 'BIT Medical Officer',
        doctor_room: selectedDoctor?.opd_room || 'OPD Room 101',
        reason_for_visit: reason.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Booking failed. Slot may already be reserved.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Book Health Center Appointment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a certified medical officer, date, time slot, and reason for in-person consultation.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Real-time slot allocation & consecutive token assignment</span>
        </div>
      </div>

      {successAppt ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">In-Person Appointment Confirmed!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Your appointment has been registered in the BIT Health Center database.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 text-left">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Appointment Ref:</span>
              <span className="font-mono font-bold text-[#0f2942]">{successAppt.appointment_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Queue Token Number:</span>
              <span className="font-bold text-base text-teal-700">#{successAppt.token_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Consulting Physician:</span>
              <span className="font-semibold text-slate-900">{successAppt.doctor_name || selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">OPD Location:</span>
              <span className="font-medium text-slate-900">{successAppt.doctor_room || selectedDoctor?.opd_room || 'Room 101, Ground Floor'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Scheduled Date & Time:</span>
              <span className="font-medium text-slate-900">{successAppt.appointment_date} at {successAppt.time_slot}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Mode:</span>
              <span className="font-semibold text-teal-800">In-Person OPD Consultation</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 block mb-1">Reason for Consultation:</span>
              <p className="font-medium text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                "{successAppt.reason_for_visit}"
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/student/appointments')}
              className="px-4 py-2 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              View in My Appointments
            </button>
            <button
              onClick={() => {
                setSuccessAppt(null);
                setReason('');
                setSymptoms('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          
          {error && (
            <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-6 space-y-6">
            
            {/* 1. Select Doctor */}
            <div>
              <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-2">
                1. Select Attending Medical Officer
              </label>

              {loadingDoctors ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading doctor profiles...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border transition flex items-center gap-3 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <img
                          src={doc.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80'}
                          alt={doc.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-teal-800 font-medium truncate">{doc.specialization}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{doc.opd_room}</span>
                            <span>•</span>
                            <span>{doc.experience_years} yrs exp</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Select Date & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-1.5">
                  2. Select Consultation Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-1.5">
                  Consultation Mode
                </label>
                <div className="py-2.5 px-3 bg-[#EAF3FA] border border-[#DCE5EE] rounded-lg flex items-center gap-2.5 text-xs text-[#142F49]">
                  <MapPin className="w-4 h-4 text-[#008780] shrink-0" />
                  <div>
                    <span className="font-bold text-[#142F49] block">In-Person OPD Consultation</span>
                    <span className="text-[11px] text-[#657D96]">Campus Health Center • {selectedDoctor?.opd_room || 'Room 101, Ground Floor'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Time Slots */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider">
                  3. Select Available Slot
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedDoctor ? `${selectedDoctor.name} (${selectedDate})` : ''}
                </span>
              </div>

              {loadingSlots ? (
                <div className="p-4 text-center text-xs text-slate-400">Checking slot availability...</div>
              ) : slots.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  No slots available for this doctor on the selected date. Please choose another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((s) => {
                    const isSelected = selectedSlot === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`py-2 px-2 text-xs font-mono rounded-lg border text-center transition ${
                          !s.available
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                        }`}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Reason for Visit */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-1.5">
                  4. Primary Reason for Visit
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Severe headache, allergic reaction, fever, sports ankle pain"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-1.5">
                  Symptoms & Duration (Optional Details)
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms (e.g. Started 2 days ago after evening lab session, accompanied by mild chills)..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Selected Slot: <strong className="text-slate-800 font-mono">{selectedSlot || 'None'}</strong>
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 text-teal-300" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
