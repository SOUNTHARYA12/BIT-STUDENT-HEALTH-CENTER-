import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  Stethoscope,
  ShieldCheck,
  User,
  HeartPulse,
  Activity,
  FileText,
} from 'lucide-react';

export const DoctorTeleconsultation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [onlineAppointments, setOnlineAppointments] = useState<any[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>('');
  const [consultationData, setConsultationData] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    loadOnlineSessions();
  }, []);

  useEffect(() => {
    if (selectedApptId) {
      loadSession(selectedApptId);
      const timer = setInterval(() => loadMessages(selectedApptId), 4000);
      return () => clearInterval(timer);
    }
  }, [selectedApptId]);

  const loadOnlineSessions = async () => {
    try {
      const data = await apiFetch<any[]>('/api/appointments');
      const onlineList = data.filter(a => a.consultation_type === 'online');
      setOnlineAppointments(onlineList);

      if (onlineList.length > 0) {
        setSelectedApptId(onlineList[0].id);
      }
    } catch (err) {
      console.error('Failed to load teleconsult sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const res = await apiFetch<any>(`/api/consultations/${id}`);
      setConsultationData(res);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const res = await apiFetch<any>(`/api/consultations/${id}`);
      setMessages(res.messages || []);
    } catch (e) {
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
      console.error('Error sending message:', err);
    }
  };

  const appt = consultationData?.appointment;

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Opening teleconsultation terminal...</div>;
  }

  if (onlineAppointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
        <Video className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Online Consultations Booked</h2>
        <p className="text-xs text-slate-500">
          When students book online appointments, their remote sessions will be queued here for clinical review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Session Select Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0f2942]">Active Online Session:</span>
          <select
            value={selectedApptId}
            onChange={(e) => setSelectedApptId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            {onlineAppointments.map(a => (
              <option key={a.id} value={a.id}>
                {a.student_name} ({a.appointment_number} - Tk #{a.token_number})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => navigate(`/doctor/workspace?apptId=${selectedApptId}`)}
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Open Full Clinical Prescription Writer</span>
        </button>
      </div>

      {/* Main Video & Live Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Remote Patient Video Call */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video shadow-md border border-slate-800 flex items-center justify-center">
            
            {/* Patient Remote Feed */}
            <div className="w-full h-full relative">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80"
                alt="Student Remote Patient"
                className="w-full h-full object-cover"
              />

              {/* Overlay: Patient Label */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">{appt?.student_name || 'Student Patient'}</span>
                <span className="text-[10px] text-teal-300 font-mono">({appt?.student_roll})</span>
              </div>

              {/* Encryption watermark */}
              <div className="absolute top-4 right-4 bg-slate-900/80 text-[10px] text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>BIT Clinical WebRTC • Protected</span>
              </div>

              {/* Doctor Self-View */}
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-44 sm:h-32 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
                {isVideoOn ? (
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'}
                    alt="Doctor Self"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                  Dr. Saravanan ({isMicOn ? 'Live' : 'Muted'})
                </div>
              </div>
            </div>

            {/* Media Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-xs px-4 py-2 rounded-full border border-slate-700">
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-full text-white transition ${isMicOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'}`}
                title={isMicOn ? 'Mute' : 'Unmute'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2.5 rounded-full text-white transition ${isVideoOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-500'}`}
                title={isVideoOn ? 'Stop Camera' : 'Start Camera'}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Symptoms Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-[#0f2942]">Patient Reported Symptoms & Complaint</span>
              <StatusBadge status={appt?.status || 'booked'} size="sm" />
            </div>
            <p className="text-slate-700 italic">
              "{appt?.reason_for_visit}"
            </p>
          </div>
        </div>

        {/* Right 1 Col: Chat Stream */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-2xs h-[520px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-[#0f2942]">Telehealth Consultation Chat</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-40" />
                <span>No messages sent yet. Message the patient here.</span>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
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

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type clinical advice or questions..."
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
  );
};
