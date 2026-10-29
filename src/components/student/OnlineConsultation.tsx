import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PrescriptionModal } from '../common/PrescriptionModal';
import { StatusBadge } from '../common/StatusBadge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  PhoneOff,
  User,
  Activity,
  HeartPulse,
} from 'lucide-react';

export const OnlineConsultation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appointmentIdParam = searchParams.get('id');
  const { user } = useAuth();

  const [activeAppointments, setActiveAppointments] = useState<any[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>(appointmentIdParam || '');
  const [consultationData, setConsultationData] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Video call controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showRxModal, setShowRxModal] = useState(false);

  useEffect(() => {
    loadOnlineAppointments();
  }, []);

  useEffect(() => {
    if (selectedApptId) {
      loadConsultationRoom(selectedApptId);
      const timer = setInterval(() => loadMessages(selectedApptId), 4000);
      return () => clearInterval(timer);
    }
  }, [selectedApptId]);

  const loadOnlineAppointments = async () => {
    try {
      const data = await apiFetch<any[]>('/api/appointments');
      const onlineOnes = data.filter(a => a.consultation_type === 'online');
      setActiveAppointments(onlineOnes);

      if (!selectedApptId && onlineOnes.length > 0) {
        setSelectedApptId(onlineOnes[0].id);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConsultationRoom = async (apptId: string) => {
    try {
      const res = await apiFetch<any>(`/api/consultations/${apptId}`);
      setConsultationData(res);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load consultation data:', err);
    }
  };

  const loadMessages = async (apptId: string) => {
    try {
      const res = await apiFetch<any>(`/api/consultations/${apptId}`);
      setMessages(res.messages || []);
      if (res.prescription) {
        setConsultationData((prev: any) => ({ ...prev, prescription: res.prescription }));
      }
    } catch (err) {
      // quiet poll
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedApptId) return;

    try {
      const sent = await apiFetch(`/api/consultations/${selectedApptId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMsg.trim() }),
      });
      setMessages(prev => [...prev, sent]);
      setNewMsg('');
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const appt = consultationData?.appointment;
  const prescription = consultationData?.prescription;
  const consult = consultationData?.consultation;

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Connecting to consultation room...</div>;
  }

  if (activeAppointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
        <Video className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Online Consultations Scheduled</h2>
        <p className="text-xs text-slate-500">
          You currently have no teleconsultation appointments. When booking an appointment, select "Online Video OPD" to consult a doctor remotely.
        </p>
        <Link
          to="/student/book"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2942] text-white text-xs font-medium rounded-lg hover:bg-[#163654] transition"
        >
          Book Online Consultation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Consultation Selector if multiple */}
      {activeAppointments.length > 1 && (
        <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
          <span className="font-semibold text-slate-600">Select Session:</span>
          {activeAppointments.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedApptId(a.id)}
              className={`px-3 py-1 rounded-md transition ${
                selectedApptId === a.id ? 'bg-[#0f2942] text-white font-medium' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {a.appointment_number} ({a.doctor_name})
            </button>
          ))}
        </div>
      )}

      {/* Main Room Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Video Stream & Media Bar */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Main Video Screen */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video shadow-md border border-slate-800 flex items-center justify-center">
            
            {/* Doctor Stream */}
            <div className="w-full h-full relative">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80"
                alt="Doctor Teleconsultation"
                className="w-full h-full object-cover"
              />
              
              {/* Doctor Name Overlay */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">{appt?.doctor_name || 'Dr. K. Saravanan'}</span>
                <span className="text-[10px] text-teal-300">({appt?.doctor_specialization || 'Attending Physician'})</span>
              </div>

              {/* Secure Institutional Watermark */}
              <div className="absolute top-4 right-4 bg-slate-900/80 text-[10px] text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>BIT Encrypted Telehealth</span>
              </div>

              {/* Student Self-View Pip */}
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-44 sm:h-32 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
                {isVideoOn ? (
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'}
                    alt="Self View"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                  You ({isMicOn ? 'Mic On' : 'Muted'})
                </div>
              </div>

            </div>

            {/* In-Call Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-xs px-4 py-2 rounded-full border border-slate-700">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-full text-white transition ${isMicOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'}`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2.5 rounded-full text-white transition ${isVideoOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'}`}
                title={isVideoOn ? 'Stop Video' : 'Start Video'}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <div className="w-px h-5 bg-slate-700 mx-1" />

              {prescription && (
                <button
                  type="button"
                  onClick={() => setShowRxModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Issued Rx</span>
                </button>
              )}
            </div>

          </div>

          {/* Consultation Notes & Vitals Summary */}
          {consult && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider">
                    Clinical Notes & Recorded Vitals
                  </h3>
                </div>
                <StatusBadge status={consult.status} size="sm" />
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Blood Pressure</span>
                  <span className="font-bold text-slate-800">{consult.vitals_bp || '120/80 mmHg'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Pulse Rate</span>
                  <span className="font-bold text-slate-800">{consult.vitals_pulse ? `${consult.vitals_pulse} bpm` : '74 bpm'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Body Temp</span>
                  <span className="font-bold text-slate-800">{consult.vitals_temp ? `${consult.vitals_temp} °F` : '98.6 °F'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Oxygen SpO2</span>
                  <span className="font-bold text-slate-800">{consult.vitals_spo2 ? `${consult.vitals_spo2} %` : '99 %'}</span>
                </div>
              </div>

              {/* Diagnosis and Treatment */}
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-700">Diagnosis: </span>
                  <span className="font-bold text-teal-900">{consult.diagnosis}</span>
                </div>
                {consult.doctor_advice && (
                  <div>
                    <span className="font-semibold text-slate-700">Physician Advice: </span>
                    <span className="text-slate-600">{consult.doctor_advice}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Live Telehealth Chat & Session Info */}
        <div className="space-y-4 flex flex-col h-full">
          
          {/* Session Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#0f2942]">{appt?.appointment_number}</span>
              <StatusBadge status={appt?.status || 'booked'} size="sm" />
            </div>
            <div className="font-medium text-slate-800">
              Token #{appt?.token_number} • {appt?.time_slot}
            </div>
            <p className="text-[11px] text-slate-500">
              Reason: {appt?.reason_for_visit}
            </p>
          </div>

          {/* Interactive Chat Box */}
          <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-2xs min-h-[380px]">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-[#0f2942]">Consultation Messages</span>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <span>No messages exchanged yet. Use this channel to ask questions or report symptoms to the doctor.</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5">
                        {m.sender_name} ({m.sender_role})
                      </div>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#0f2942] text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a clinical query or symptom..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0f2942]"
              />
              <button
                type="submit"
                disabled={!newMsg.trim()}
                className="p-2 bg-[#0f2942] hover:bg-[#163654] text-white rounded-lg transition disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Prescription Modal */}
      {showRxModal && prescription && (
        <PrescriptionModal
          prescription={prescription}
          onClose={() => setShowRxModal(false)}
        />
      )}

    </div>
  );
};
