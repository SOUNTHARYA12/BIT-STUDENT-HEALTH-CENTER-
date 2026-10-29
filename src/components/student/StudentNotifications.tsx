import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Pill,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/student/dashboard-summary');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Health Center Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates on appointment status, pharmacy stock changes, and doctor clinic schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/student/appointments"
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/50"
          >
            My Appointments
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No new notifications</p>
            <p className="text-xs text-slate-400 mt-1">You are all caught up with your healthcare events.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isCompleted = notif.icon === 'check' || notif.type === 'appointment_completed';
            const isPill = notif.icon === 'pill' || notif.type === 'medicine_alert';

            return (
              <div
                key={notif.id}
                className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : isPill
                        ? 'bg-violet-50 text-violet-600 border border-violet-100'
                        : 'bg-sky-50 text-sky-600 border border-sky-100'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                    {isPill && <Pill className="w-5 h-5" />}
                    {!isCompleted && !isPill && <Calendar className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{notif.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.timeAgo}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 shrink-0">
                  Verified
                </span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
