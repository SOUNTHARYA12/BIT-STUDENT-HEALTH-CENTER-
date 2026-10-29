import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import {
  Stethoscope,
  MapPin,
  Clock,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DoctorProfile: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const docProfile = profile as any;

  const [opdRoom, setOpdRoom] = useState(docProfile?.opd_room || 'OPD Room 101, Ground Floor');
  const [bio, setBio] = useState(docProfile?.bio || '');
  const [isAvailable, setIsAvailable] = useState(docProfile?.is_available_today === 1);
  const [phone, setPhone] = useState(user?.phone || '');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          opd_room: opdRoom,
          bio,
          is_available_today: isAvailable,
        }),
      });

      await refreshUser();
      setMsg({ type: 'success', text: 'Doctor profile and OPD parameters updated.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Doctor Profile & OPD Schedule</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure clinical specializations, OPD room designation, and daily visiting status.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-teal-600/30 shrink-0">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              BIT Campus Medical Officer
            </span>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <div className="text-xs text-slate-500 font-mono">
              Employee ID: <strong>{docProfile?.employee_id || 'BIT-DOC-001'}</strong> • {user?.email}
            </div>
            <div className="text-xs text-teal-800 font-semibold mt-0.5">
              {docProfile?.specialization} ({docProfile?.qualification})
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              OPD Room Location
            </label>
            <input
              type="text"
              value={opdRoom}
              onChange={(e) => setOpdRoom(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Professional Bio & Clinical Focus
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Available for OPD Consultations Today</span>
              <span className="text-[11px] text-slate-500">Toggle if you are temporarily on campus rounds or off-duty</span>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
