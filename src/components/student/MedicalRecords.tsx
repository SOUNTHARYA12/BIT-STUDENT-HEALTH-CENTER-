import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PrescriptionModal } from '../common/PrescriptionModal';
import {
  History,
  HeartPulse,
  Activity,
  FileText,
  AlertTriangle,
  Calendar,
  Stethoscope,
  Pill,
  ShieldCheck,
  User,
  Search,
  RotateCcw,
} from 'lucide-react';

export const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [recordData, setRecordData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadEMR(user.id);
    }
  }, [user]);

  const loadEMR = async (studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use 'me' or user.id
      const res = await apiFetch(`/api/emr/patient/${studentId || 'me'}`);
      setRecordData(res);
    } catch (err: any) {
      console.error('Failed to load EMR records:', err);
      setError(err.message || 'Unable to load your medical history records.');
    } finally {
      setLoading(false);
    }
  };

  const student = recordData?.student;
  const rawHistory = recordData?.medicalHistory || [];
  const history = rawHistory.filter((rec: any) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      rec.diagnosis?.toLowerCase().includes(q) ||
      rec.doctor_name?.toLowerCase().includes(q) ||
      rec.symptoms?.toLowerCase().includes(q) ||
      rec.treatment_recommendations?.toLowerCase().includes(q) ||
      rec.prescription_code?.toLowerCase().includes(q) ||
      rec.appointment_date?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Electronic Medical Records (EMR)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized longitudinal clinical timeline, vital signs history, and past treatments.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Patient Confidential Health Record • Encrypted</span>
        </div>
      </div>

      {/* Patient Health Overview Card */}
      {student && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 ring-2 ring-teal-500/30 overflow-hidden shrink-0">
                <img
                  src={student.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  BIT Registered Student
                </span>
                <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                <div className="text-xs text-slate-500 font-mono">
                  Roll No: <strong>{student.roll_no || student.register_number}</strong> • Dept: {student.department} ({student.year_of_study})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-rose-500 font-medium uppercase block">Blood Group</span>
                <span className="text-xl font-black text-rose-700">{student.blood_group || 'O+'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left min-w-[140px]">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Hostel Residence</span>
                <span className="font-bold text-slate-800 text-xs block mt-0.5">{student.hostel_block || 'Cauvery Hostel'}</span>
                <span className="text-[11px] text-slate-500">{student.room_no || 'Room 312'}</span>
              </div>
            </div>
          </div>

          {/* Allergies & Chronic Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900">
              <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Known Allergies
              </span>
              <span>{student.known_allergies || 'No known allergies reported.'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold flex items-center gap-1.5 mb-1 text-slate-800">
                <Activity className="w-3.5 h-3.5 text-teal-600" /> Chronic Medical Conditions
              </span>
              <span>{student.chronic_conditions || 'None reported.'}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => user?.id && loadEMR(user.id)}
            className="px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Clinical Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-teal-700" />
            <span>Consultation & Treatment History ({history.length} {rawHistory.length !== history.length ? `filtered from ${rawHistory.length}` : 'Records'})</span>
          </h2>

          {rawHistory.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search visits by diagnosis, doctor, medicine..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading electronic records...</div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No clinical records logged yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {history.map((record: any, idx: number) => (
              <div key={record.id || idx} className="relative group">
                
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-teal-600 border-2 border-white text-white flex items-center justify-center shadow-xs">
                  <Stethoscope className="w-3 h-3" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{record.diagnosis}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {record.appointment_number}
                        </span>
                      </div>
                      <div className="text-xs text-teal-800 mt-0.5">
                        Consulting Physician: <strong>{record.doctor_name}</strong> ({record.doctor_specialization})
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.appointment_date} • {record.time_slot}</span>
                    </div>
                  </div>

                  {/* Vitals Recorded */}
                  {(record.vitals_bp || record.vitals_temp || record.vitals_pulse) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs">
                      {record.vitals_bp && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">BP</span>
                          <span className="font-bold text-slate-800">{record.vitals_bp}</span>
                        </div>
                      )}
                      {record.vitals_pulse && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Pulse</span>
                          <span className="font-bold text-slate-800">{record.vitals_pulse} bpm</span>
                        </div>
                      )}
                      {record.vitals_temp && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Temperature</span>
                          <span className="font-bold text-slate-800">{record.vitals_temp} °F</span>
                        </div>
                      )}
                      {record.vitals_spo2 && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">SpO2</span>
                          <span className="font-bold text-slate-800">{record.vitals_spo2} %</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Symptoms & Clinical Notes */}
                  <div className="text-xs space-y-2 py-2">
                    {record.symptoms && (
                      <div>
                        <span className="font-semibold text-slate-700">Symptoms: </span>
                        <span className="text-slate-600">{record.symptoms}</span>
                      </div>
                    )}
                    {record.clinical_notes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700 block mb-0.5">Clinical Examination Notes:</span>
                        <span className="text-slate-600">{record.clinical_notes}</span>
                      </div>
                    )}
                    {record.treatment_recommendations && (
                      <div>
                        <span className="font-semibold text-slate-700">Treatment Recommendations: </span>
                        <span className="text-slate-600">{record.treatment_recommendations}</span>
                      </div>
                    )}
                  </div>

                  {/* Associated Prescription */}
                  {record.prescription_id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-teal-800 font-medium">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Prescription Code: {record.prescription_code}</span>
                      </div>
                      <button
                        onClick={async () => {
                          const fullRx = await apiFetch(`/api/prescriptions/${record.prescription_id}`);
                          setSelectedRx(fullRx);
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline"
                      >
                        View Prescription Details
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRx && (
        <PrescriptionModal
          prescription={selectedRx}
          onClose={() => setSelectedRx(null)}
        />
      )}

    </div>
  );
};
