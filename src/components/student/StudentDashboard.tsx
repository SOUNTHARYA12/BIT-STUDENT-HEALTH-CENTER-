import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { Appointment } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  FileText,
  Pill,
  Bot,
  Bell,
  Stethoscope,
  Clock,
  ArrowRight,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
  Award,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  role_title?: string;
  specialization: string;
  qualification: string;
  opd_room: string;
  experience_years: number;
  avatar_url: string;
  start_time: string;
  end_time: string;
  available_days: string;
  is_available_today?: number;
  consultation_timings?: string;
}

interface DashboardSummary {
  upcomingAppointment: any | null;
  medicalRecordsCount: number;
  medicineStockSummary: {
    totalTypes: number;
    totalUnits: number;
  };
  myAppointments: any[];
  notifications: any[];
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [dashboardMsg, setDashboardMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleOpenCancelModal = (appt: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (appt.status === 'completed') {
      setDashboardMsg({ text: 'Cannot cancel an appointment that has already been completed.', type: 'error' });
      return;
    }
    if (appt.status === 'cancelled') {
      setDashboardMsg({ text: 'This appointment is already cancelled.', type: 'error' });
      return;
    }
    if (appt.status === 'in_consultation') {
      setDashboardMsg({ text: 'Cannot cancel an appointment that is currently in consultation with the doctor.', type: 'error' });
      return;
    }
    setCancelTarget(appt);
    setCancelModalError(null);
  };

  const handleConfirmCancelDashboard = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    setCancelModalError(null);

    try {
      await apiFetch(`/api/appointments/${cancelTarget.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });

      // Immediately update local appointments list
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
      );

      // Immediately update summary upcoming appointment if this was it
      setSummary((prev) => {
        if (!prev) return prev;
        const isThisUpcoming = prev.upcomingAppointment?.id === cancelTarget.id;
        return {
          ...prev,
          upcomingAppointment: isThisUpcoming ? null : prev.upcomingAppointment,
          myAppointments: prev.myAppointments.map((a) =>
            a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a
          ),
        };
      });

      setDashboardMsg({
        text: `Appointment #${cancelTarget.appointment_number} has been cancelled. Your time slot (${cancelTarget.time_slot}) has been released.`,
        type: 'success',
      });

      setCancelTarget(null);
      await loadDashboardDataSilently();
    } catch (err: any) {
      setCancelModalError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Dynamic formatted live date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedDay = today.toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardDataSilently();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardDataSilently = async () => {
    try {
      const [sumData, appts, docs] = await Promise.all([
        apiFetch<DashboardSummary>('/api/student/dashboard-summary'),
        apiFetch<any[]>('/api/appointments'),
        apiFetch<Doctor[]>('/api/doctors'),
      ]);
      setSummary(sumData);
      setAppointments(appts || []);
      setDoctors(docs || []);
    } catch {}
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumData, appts, docs] = await Promise.all([
        apiFetch<DashboardSummary>('/api/student/dashboard-summary'),
        apiFetch<any[]>('/api/appointments'),
        apiFetch<Doctor[]>('/api/doctors'),
      ]);
      setSummary(sumData);
      setAppointments(appts || []);
      setDoctors(docs || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format appointment date box (Day number & Month name)
  const formatApptDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { day: '28', month: 'OCT' };
      }
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      return { day, month };
    } catch {
      return { day: '28', month: 'OCT' };
    }
  };

  // Helper to format appointment status badge with uniform width for straight alignment
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') {
      return (
        <span className="w-24 text-center inline-flex items-center justify-center text-xs font-semibold py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          Completed
        </span>
      );
    }
    if (s === 'in_consultation' || s === 'checked_in') {
      return (
        <span className="w-24 text-center inline-flex items-center justify-center text-xs font-semibold py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
          Upcoming
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="w-24 text-center inline-flex items-center justify-center text-xs font-semibold py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
          Cancelled
        </span>
      );
    }
    return (
      <span className="w-24 text-center inline-flex items-center justify-center text-xs font-semibold py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
        Scheduled
      </span>
    );
  };

  const upcomingAppt = summary?.upcomingAppointment;
  const recentAppts = appointments.length > 0 ? appointments.slice(0, 4) : summary?.myAppointments || [];
  const notificationsList = summary?.notifications || [
    {
      id: '1',
      title: 'Appointment Completed',
      message: 'Your appointment with Dr. Priya Sharma has been marked as completed.',
      timeAgo: '2 hours ago',
      icon: 'check',
    },
    {
      id: '2',
      title: 'Medicine Alert',
      message: 'Paracetamol stock is running low (only 5 left).',
      timeAgo: '4 hours ago',
      icon: 'pill',
    },
    {
      id: '3',
      title: 'Slot Available',
      message: 'New appointment slot available with Dr. Karthik S on 28 Oct, 2:00 PM.',
      timeAgo: '1 day ago',
      icon: 'calendar',
    },
  ];

  // 3 BIT Medical Officers required by BIT Student Health Center
  const defaultDoctors: Doctor[] = [
    {
      id: 'usr_doc_01',
      name: 'Dr. K. Saravanan, MBBS, MD',
      role_title: 'Chief Medical Officer',
      specialization: 'General Medicine & Preventive Health',
      qualification: 'MBBS, MD',
      opd_room: 'OPD Room 101, Ground Floor',
      experience_years: 14,
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
      start_time: '09:00',
      end_time: '19:30',
      available_days: 'Monday–Saturday',
      consultation_timings: 'Monday–Saturday, 9:00 AM–1:30 PM and 4:00 PM–7:30 PM',
      is_available_today: 1,
    },
    {
      id: 'usr_doc_02',
      name: 'Dr. S. Kavitha, MBBS, DGO',
      role_title: 'Senior Physician',
      specialization: "Student Wellness & Women's Health",
      qualification: 'MBBS, DGO',
      opd_room: 'OPD Room 104, Ground Floor',
      experience_years: 10,
      avatar_url: 'https://images.unsplash.com/photo-1594824813637-433364f32630?w=200&auto=format&fit=crop&q=80',
      start_time: '10:00',
      end_time: '16:00',
      available_days: 'Monday–Friday',
      consultation_timings: 'Monday–Friday, 10:00 AM–4:00 PM',
      is_available_today: 1,
    },
    {
      id: 'usr_doc_03',
      name: 'Dr. P. Vignesh, MBBS',
      role_title: 'Emergency Care',
      specialization: 'Sports Injury, Trauma & Triage',
      qualification: 'MBBS',
      opd_room: 'Emergency & Triage Bay, Ground Floor',
      experience_years: 7,
      avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
      start_time: '08:00',
      end_time: '20:00',
      available_days: '24/7 Rotational Duty',
      consultation_timings: '24/7 Rotational Campus Duty',
      is_available_today: 1,
    },
  ];

  // Guaranteed list of all 3 doctors merging backend data with verified defaults
  const displayDoctors: Doctor[] = defaultDoctors.map((defDoc) => {
    const liveDoc = doctors.find((d) => d.id === defDoc.id);
    if (!liveDoc) return defDoc;
    return {
      ...defDoc,
      ...liveDoc,
      role_title: liveDoc.role_title || defDoc.role_title,
      consultation_timings: liveDoc.consultation_timings || defDoc.consultation_timings,
    };
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Welcome Banner with BIT Hospital Background */}
      <div
        className="rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden relative bg-cover bg-center min-h-[175px] sm:min-h-[195px] flex items-center"
        style={{
          backgroundImage: `url('/assets/bit_hospital_hero.jpg')`,
        }}
      >
        {/* Soft light gradient overlay across banner to preserve clear text readability */}
        <div className="absolute inset-0 bg-linear-to-r from-[#eaf6f4]/95 via-[#ebf7f5]/85 to-transparent/20 pointer-events-none" />

        <div className="relative z-10 w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-2">
              <span>Hello, {user?.name || 'Sountharya R'}</span>
              <span className="text-2xl">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Take care of your health, it's your greatest asset.
            </p>
            <p className="text-xs text-teal-800 font-semibold tracking-wide pt-1">
              BIT Student Health Center
            </p>
          </div>

          {/* Top-Right Date Card Pill matching reference image */}
          <div className="self-start md:self-auto bg-white/90 backdrop-blur-xs border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-2xs flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {formattedDate}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight capitalize">
                {formattedDay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {dashboardMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            dashboardMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {dashboardMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{dashboardMsg.text}</span>
          </div>
          <button
            onClick={() => setDashboardMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Upcoming Appointment */}
        <div
          onClick={() => navigate(upcomingAppt ? '/student/appointments' : '/student/book')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">
                Upcoming Appointment
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-[140px] truncate">
                {upcomingAppt
                  ? `${upcomingAppt.doctor_name} • ${upcomingAppt.time_slot}`
                  : 'No upcoming appointments'}
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-teal-50 flex items-center justify-center text-slate-400 group-hover:text-teal-700 transition shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Medical Records */}
        <div
          onClick={() => navigate('/student/records')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 text-sky-700 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-800 transition">
                Medical Records
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                View your health history
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center text-slate-400 group-hover:text-sky-700 transition shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Medicine Stock */}
        <div
          onClick={() => navigate('/student/medicines')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 text-violet-700 group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-violet-800 transition">
                Medicine Stock
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Check available medicines
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-violet-50 flex items-center justify-center text-slate-400 group-hover:text-violet-700 transition shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: AI Health Triage */}
        <div
          onClick={() => navigate('/student/triage')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                AI Health Triage
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Get preliminary guidance
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 transition shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* 3. BIT Campus Medical Officers — Displaying All 3 Doctors */}
      <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] border border-[#DCE5EE] flex items-center justify-center text-[#008780] shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#142F49]">
                  BIT Campus Medical Officers
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF3FA] text-[#008780] border border-[#DCE5EE]">
                  3 Physicians on Campus
                </span>
              </div>
              <p className="text-xs text-[#657D96] mt-0.5">
                Qualified medical officers available for student OPD consultations, health checks, and emergency care.
              </p>
            </div>
          </div>

          <Link
            to="/student/doctors"
            className="text-xs font-semibold text-[#008780] hover:text-[#007C76] flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
          >
            <span>View All Doctors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {displayDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#F5F8FA] hover:bg-white rounded-xl border border-[#DCE5EE] hover:border-[#008780]/40 p-4.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name & Role Badge */}
                <div className="flex items-start gap-3">
                  <img
                    src={doc.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
                    alt={doc.name}
                    className="w-13 h-13 rounded-xl object-cover ring-1 ring-[#DCE5EE] shrink-0 group-hover:ring-[#008780]/40 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EAF3FA] text-[#142F49] border border-[#DCE5EE] mb-1">
                      {doc.role_title || 'Campus Physician'}
                    </span>
                    <h3 className="font-bold text-sm text-[#142F49] leading-tight truncate">
                      {doc.name}
                    </h3>
                    <p className="text-[11px] font-medium text-[#657D96] mt-0.5">
                      {doc.qualification}
                    </p>
                  </div>
                </div>

                {/* Specialty Box */}
                <div className="bg-white rounded-lg p-2.5 border border-[#DCE5EE]/80">
                  <span className="text-[10px] font-bold text-[#657D96] uppercase tracking-wider block">Specialty</span>
                  <span className="text-xs font-semibold text-[#008780] block mt-0.5 leading-snug">
                    {doc.specialization}
                  </span>
                </div>

                {/* Consultation Timings & Location */}
                <div className="space-y-1.5 text-xs text-[#142F49] pt-0.5">
                  <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <Clock className="w-3.5 h-3.5 text-[#008780] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#142F49]">Consultation: </span>
                      <span className="text-[#657D96]">
                        {doc.consultation_timings || `${doc.available_days}, ${doc.start_time}–${doc.end_time}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#657D96]">
                    <MapPin className="w-3.5 h-3.5 text-[#657D96] shrink-0" />
                    <span className="truncate">{doc.opd_room}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3.5 mt-3 border-t border-[#DCE5EE] flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Campus OPD Duty
                </span>
                <Link
                  to={`/student/book?doctorId=${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-bold rounded-lg shadow-xs transition group-hover:scale-[1.02]"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Book Appointment</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Main Dashboard Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Appointments & AI Triage banner) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* My Appointments Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-teal-700" />
                <h2 className="text-sm sm:text-base font-bold text-[#0f2942]">
                  My Appointments
                </h2>
              </div>
              <Link
                to="/student/appointments"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
              >
                View All
              </Link>
            </div>

            {/* List of Real Appointments */}
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading your appointments...
              </div>
            ) : recentAppts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No appointments scheduled</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You currently have no active or previous visits.</p>
                <Link
                  to="/student/book"
                  className="mt-3 inline-block px-3.5 py-1.5 bg-[#007d79] text-white text-xs font-medium rounded-lg"
                >
                  Book New Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppts.map((appt) => {
                  const dateBox = formatApptDate(appt.appointment_date);
                  const docDept = appt.doctor_specialization || 'General Physician';

                  return (
                    <div
                      key={appt.id}
                      onClick={() => navigate('/student/appointments')}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:bg-slate-50/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Date Box on Left */}
                        <div className="w-13 h-13 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center shrink-0 text-center">
                          <span className="text-sm sm:text-base font-extrabold text-[#0f2942] leading-none">
                            {dateBox.day}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-none">
                            {dateBox.month}
                          </span>
                        </div>

                        {/* Middle Info */}
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition flex items-center gap-1.5 min-w-0">
                            <span className="text-[#008780] font-bold shrink-0">Reason:</span>
                            <span className="truncate font-semibold text-slate-900">{appt.reason_for_visit || docDept}</span>
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">
                            {appt.doctor_name} • <span className="text-slate-400 font-medium">In-Person OPD</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{appt.time_slot || '10:30 AM - 11:00 AM'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge & Cancel Action with uniform alignment */}
                      <div className="flex items-center justify-end gap-2.5 shrink-0 pl-2">
                        {renderStatusBadge(appt.status)}
                        {['booked', 'checked_in'].includes(appt.status) && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenCancelModal(appt, e)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                            title="Cancel appointment and release slot"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Need Help? AI Health Triage Assistance Card matching reference */}
          <div className="bg-[#e6f4f2]/80 border border-teal-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white text-teal-800 flex items-center justify-center shrink-0 shadow-2xs border border-teal-100">
                <Stethoscope className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Need Help?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-md">
                  Use our AI Health Triage Assistant for preliminary health guidance based on your symptoms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/triage')}
              className="bg-[#007d79] hover:bg-[#006864] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Try Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Right Column (Quick Actions & Recent Notifications) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Actions Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm sm:text-base font-bold text-[#0f2942]">
                Quick Actions
              </h2>
            </div>

            {/* 2x2 Grid of Attractive Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Action 1: Book Appointment */}
              <div
                onClick={() => navigate('/student/book')}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
              >
                <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">
                    Book Appointment
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Choose doctor & time slot
                  </p>
                </div>
              </div>

              {/* Action 2: View Medical Records */}
              <div
                onClick={() => navigate('/student/records')}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
              >
                <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 group-hover:scale-105 transition-transform mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-800 transition">
                    View Medical Records
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Access your health reports
                  </p>
                </div>
              </div>

              {/* Action 3: Check Medicine Stock */}
              <div
                onClick={() => navigate('/student/medicines')}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
              >
                <div className="w-9 h-9 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 group-hover:scale-105 transition-transform mb-2">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-800 transition">
                    Check Medicine Stock
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    View available medicines
                  </p>
                </div>
              </div>

              {/* Action 4: Ask AI Health Triage */}
              <div
                onClick={() => navigate('/student/triage')}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[105px]"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform mb-2">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                    Ask AI Health Triage
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Describe your symptoms
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Recent Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm sm:text-base font-bold text-[#0f2942]">
                  Recent Notifications
                </h3>
              </div>
              <Link
                to="/student/notifications"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3.5">
              {notificationsList.map((notif) => {
                const isCheck = notif.icon === 'check' || notif.type === 'appointment_completed';
                const isPill = notif.icon === 'pill' || notif.type === 'medicine_alert';

                return (
                  <div key={notif.id} className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isCheck
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : isPill
                            ? 'bg-violet-50 text-violet-600 border border-violet-100'
                            : 'bg-sky-50 text-sky-600 border border-sky-100'
                        }`}
                      >
                        {isCheck && <CheckCircle2 className="w-4 h-4" />}
                        {isPill && <Pill className="w-4 h-4" />}
                        {!isCheck && !isPill && <Calendar className="w-4 h-4" />}
                      </div>

                      <div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                      {notif.timeAgo}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

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
                Are you sure you want to cancel this appointment? Your booked time slot will be released immediately so another student can book it.
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
                onClick={handleConfirmCancelDashboard}
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
