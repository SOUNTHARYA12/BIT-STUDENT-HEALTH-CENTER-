import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { PrescriptionModal } from '../common/PrescriptionModal';
import {
  Search,
  User,
  History,
  AlertTriangle,
  Stethoscope,
  Calendar,
  FileText,
  Activity,
  HeartPulse,
} from 'lucide-react';

export const DoctorEMR: React.FC = () => {
  const [searchRoll, setSearchRoll] = useState('7376231AD101');
  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  const samplePatients = [
    { roll: '7376231AD101', name: 'Sountharya R', dept: 'AI & Data Science' },
    { roll: '7376221CS105', name: 'Dinesh Kumar S', dept: 'Computer Science' },
    { roll: '7376231EC102', name: 'Priya Dharshini M', dept: 'Electronics & Comm.' },
  ];

  const fetchEMRByIdentifier = async (identifier: string) => {
    setLoading(true);
    setError(null);
    setPatientData(null);

    try {
      // 1. First attempt direct EMR lookup by Roll No / Register No / User ID
      try {
        const emr = await apiFetch(`/api/emr/patient/${encodeURIComponent(identifier.trim())}`);
        if (emr && emr.student) {
          setPatientData(emr);
          setLoading(false);
          return;
        }
      } catch (directErr: any) {
        // If not a direct match by ID/roll, fall through to fuzzy search
      }

      // 2. Perform student lookup via EMR search endpoint
      const searchResults = await apiFetch<any[]>(`/api/emr/search?query=${encodeURIComponent(identifier.trim())}`);
      if (!searchResults || searchResults.length === 0) {
        setError(`No student patient found matching "${identifier}". Please check the Roll Number or Name.`);
        return;
      }

      const topMatch = searchResults[0];
      const emr = await apiFetch(`/api/emr/patient/${topMatch.id}`);
      setPatientData(emr);
    } catch (err: any) {
      setError(err.message || 'Unable to load patient medical records. Please verify permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRoll.trim()) return;
    await fetchEMRByIdentifier(searchRoll.trim());
  };

  const student = patientData?.student;
  const rawHistory = patientData?.medicalHistory || [];
  const history = rawHistory.filter((rec: any) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      rec.diagnosis?.toLowerCase().includes(q) ||
      rec.doctor_name?.toLowerCase().includes(q) ||
      rec.symptoms?.toLowerCase().includes(q) ||
      rec.prescription_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Patient Medical History & EMR Search</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized physician lookup of student clinical history, past examinations, and allergy flags.
          </p>
        </div>
        <div className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-teal-600" />
          <span>Institutional Clinical OPD Record System</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              placeholder="Enter Student Roll No (e.g. 7376231AD101, 7376221CS105) or Student Name..."
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching EMR...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Lookup Records</span>
              </>
            )}
          </button>
        </form>

        {/* Quick selection shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">Quick Lookup:</span>
          {samplePatients.map((sp) => (
            <button
              key={sp.roll}
              type="button"
              onClick={() => {
                setSearchRoll(sp.roll);
                fetchEMRByIdentifier(sp.roll);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-mono transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{sp.roll}</span>
              <span className="text-slate-400 font-sans">({sp.name})</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient EMR View */}
      {student && (
        <div className="space-y-6">
          
          {/* Patient Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 ring-2 ring-teal-500/30 shrink-0">
                  <img
                    src={student.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                  <div className="text-xs text-slate-500 font-mono">
                    Roll: <strong>{student.roll_no || student.register_number}</strong> • Dept: {student.department} ({student.year_of_study})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hostel: {student.hostel_block} ({student.room_no}) • Phone: {student.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center min-w-[85px]">
                  <span className="text-[10px] text-rose-500 uppercase block font-semibold">Blood Group</span>
                  <span className="text-lg font-black text-rose-700">{student.blood_group || 'O+'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-w-[130px]">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Emergency Contact</span>
                  <span className="font-bold text-slate-800 text-xs block mt-0.5">{student.emergency_contact_name || 'Father'}</span>
                  <span className="text-[11px] font-mono text-slate-500">{student.emergency_contact_phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Critical Allergy Flag */}
            <div className="mt-4 pt-1 flex items-center gap-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Disclosed Allergies & Sensitivities: </strong>
                {student.known_allergies || 'None reported.'}
              </span>
            </div>
          </div>

          {/* Past Clinical Visits Timeline */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                <span>Past OPD Visits & Treatments ({history.length} {rawHistory.length !== history.length ? `filtered from ${rawHistory.length}` : 'records'})</span>
              </h3>
              {rawHistory.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filter by diagnosis, doctor..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No past consultations recorded for this student.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record: any) => (
                  <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{record.diagnosis}</div>
                        <div className="text-xs text-teal-800 mt-0.5">
                          Attending Doctor: <strong>{record.doctor_name}</strong> ({record.doctor_specialization})
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {record.appointment_date} • {record.time_slot}
                      </div>
                    </div>

                    {/* Vitals summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {record.vitals_bp && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">BP</span>
                          <span className="font-bold text-slate-800">{record.vitals_bp}</span>
                        </div>
                      )}
                      {record.vitals_temp && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Temp</span>
                          <span className="font-bold text-slate-800">{record.vitals_temp} °F</span>
                        </div>
                      )}
                      {record.vitals_pulse && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Pulse</span>
                          <span className="font-bold text-slate-800">{record.vitals_pulse} bpm</span>
                        </div>
                      )}
                      {record.vitals_spo2 && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">SpO2</span>
                          <span className="font-bold text-slate-800">{record.vitals_spo2} %</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1.5 pt-1">
                      {record.symptoms && (
                        <div>
                          <strong className="text-slate-700">Symptoms: </strong>
                          <span className="text-slate-600">{record.symptoms}</span>
                        </div>
                      )}
                      {record.clinical_notes && (
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700">
                          <strong className="block text-slate-800 mb-0.5">Clinical Examination Notes:</strong>
                          {record.clinical_notes}
                        </div>
                      )}
                    </div>

                    {record.prescription_id && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-teal-800 font-semibold">
                          Rx Ref: {record.prescription_code}
                        </span>
                        <button
                          onClick={async () => {
                            const rx = await apiFetch(`/api/prescriptions/${record.prescription_id}`);
                            setSelectedRx(rx);
                          }}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                        >
                          View Prescription Details
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {selectedRx && (
        <PrescriptionModal
          prescription={selectedRx}
          onClose={() => setSelectedRx(null)}
        />
      )}

    </div>
  );
};
