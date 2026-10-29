import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  Award,
  CalendarPlus,
  Search,
} from 'lucide-react';

export const DoctorDirectory: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await apiFetch<any[]>('/api/doctors');
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.qualification.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">BIT Campus Medical Officers Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full profile of consulting physicians, qualifications, OPD rooms, and visiting hours.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor or specialty..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading doctor directory...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No medical officers match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <img
                  src={doc.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'}
                  alt={doc.name}
                  className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{doc.name}</h3>
                    {doc.role_title && (
                      <span className="text-[10px] bg-[#eaf3fa] text-[#142F49] px-2 py-0.5 rounded-md font-semibold border border-[#dce5ee]">
                        {doc.role_title}
                      </span>
                    )}
                    {doc.is_available_today ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        Available Today
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        On Leave
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#008780] mt-0.5">{doc.specialization}</div>
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.qualification}</span>
                    <span>•</span>
                    <span>{doc.experience_years} years experience</span>
                  </div>
                </div>
              </div>

              {doc.bio && (
                <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {doc.bio}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.opd_room}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.consultation_timings || `${doc.start_time} - ${doc.end_time}`}</span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Days: {doc.available_days}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-[#657D96] font-medium">BIT Medical Complex</span>
                <Link
                  to={`/student/book?doctorId=${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-medium rounded-lg shadow-xs transition"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-white" />
                  <span>Book Consultation</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
