import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import {
  User,
  ShieldCheck,
  Building2,
  Phone,
  AlertTriangle,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const studentProfile = profile as any;

  const [phone, setPhone] = useState(user?.phone || '');
  const [hostelBlock, setHostelBlock] = useState(studentProfile?.hostel_block || 'Cauvery Hostel');
  const [roomNo, setRoomNo] = useState(studentProfile?.room_no || 'Room 312');
  const [emergencyContactName, setEmergencyContactName] = useState(studentProfile?.emergency_contact_name || 'Ramalingam K');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(studentProfile?.emergency_contact_phone || '+91 94421 88901');
  const [allergies, setAllergies] = useState(studentProfile?.known_allergies || 'Dust mite allergy, Mild Penicillin sensitivity');
  const [chronic, setChronic] = useState(studentProfile?.chronic_conditions || 'None');

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          hostel_block: hostelBlock,
          room_no: roomNo,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          known_allergies: allergies,
          chronic_conditions: chronic,
        }),
      });

      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Personal and emergency health profile updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Student Health Profile & Emergency Records</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Maintain verified campus contact details, hostel residency, and critical allergy disclosures.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Header summary */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-teal-600/30 shrink-0">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Bannari Amman Institute of Technology
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Roll No: <strong>{studentProfile?.roll_no || user?.register_number}</strong> • {user?.email}
            </div>
          </div>
        </div>

        {/* Inputs Body */}
        <div className="p-6 space-y-6">
          
          {/* Institutional Immutable info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Academic Department</span>
              <span className="font-bold text-slate-800 block mt-0.5">{studentProfile?.department || 'B.Tech AI & DS'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Year of Study</span>
              <span className="font-bold text-slate-800 block mt-0.5">{studentProfile?.year_of_study || '3rd Year'}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
              <span className="text-[10px] text-rose-500 uppercase font-semibold block">Blood Group</span>
              <span className="font-extrabold text-rose-700 text-sm block mt-0.5">{studentProfile?.blood_group || 'O+'}</span>
            </div>
          </div>

          {/* Contact & Hostel Information */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>Campus Contact & Hostel Residence</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Hostel Block Name
                </label>
                <input
                  type="text"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-700" />
              <span>Emergency Contact Person</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Contact Person & Relationship
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Ramalingam K (Father)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+91 94421 88901"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Critical Medical History Disclosures */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Medical History & Allergy Disclosures</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Known Allergies (Food, Medicines, Environmental)
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Dust allergy, Penicillin allergy"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chronic Conditions or Pre-existing Illnesses
                </label>
                <input
                  type="text"
                  value={chronic}
                  onChange={(e) => setChronic(e.target.value)}
                  placeholder="e.g. Asthma, Migraine, None"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Submit */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
