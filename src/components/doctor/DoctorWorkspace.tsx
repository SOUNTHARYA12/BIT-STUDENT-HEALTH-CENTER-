import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { Appointment, Medicine, PrescriptionItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PrescriptionModal } from '../common/PrescriptionModal';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Pill,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  AlertTriangle,
  History,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DoctorWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const apptIdParam = searchParams.get('apptId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>(apptIdParam || '');
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  // Vitals
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');

  // Clinical Findings & Notes
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('Take medications after food. Maintain hydration. Review if symptoms worsen.');
  const [followUpDate, setFollowUpDate] = useState('');

  // Pharmacy Catalog for Prescription
  const [pharmacyMeds, setPharmacyMeds] = useState<Medicine[]>([]);
  const [rxItems, setRxItems] = useState<any[]>([]);

  // Item being added to Rx
  const [selectedMedId, setSelectedMedId] = useState('');
  const [itemDosage, setItemDosage] = useState('1 Tablet');
  const [itemFrequency, setItemFrequency] = useState('1-0-1 (Twice daily after food)');
  const [itemDuration, setItemDuration] = useState('3 Days');
  const [itemRoute, setItemRoute] = useState('Oral');
  const [itemInstruction, setItemInstruction] = useState('Take with warm water after meals');
  const [itemQty, setItemQty] = useState(6);

  // Status & UI
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [issuedRx, setIssuedRx] = useState<any | null>(null);

  // 1. Initial load of appointment roster and pharmacy inventory
  useEffect(() => {
    loadAppointmentsAndCatalog();
  }, []);

  const loadAppointmentsAndCatalog = async () => {
    setLoadingList(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [apptsData, medsData] = await Promise.all([
        apiFetch<Appointment[]>(`/api/appointments?date=${todayStr}`),
        apiFetch<Medicine[]>('/api/pharmacy/medicines'),
      ]);

      setPharmacyMeds(medsData);
      if (medsData.length > 0 && !selectedMedId) {
        setSelectedMedId(medsData[0].id);
      }

      // If an apptId was provided in URL, make sure it's in the list even if from another date
      let roster = [...apptsData];
      if (apptIdParam && !roster.some((a) => a.id === apptIdParam)) {
        try {
          const directAppt = await apiFetch<any>(`/api/consultations/${apptIdParam}`);
          if (directAppt?.appointment) {
            roster.unshift(directAppt.appointment);
          }
        } catch {}
      }

      setAppointments(roster);

      // Determine initial selected appointment
      if (apptIdParam) {
        setSelectedApptId(apptIdParam);
      } else if (roster.length > 0) {
        // Prefer in_consultation or checked_in appointment, else first
        const active = roster.find((a) => a.status === 'in_consultation') ||
                       roster.find((a) => a.status === 'checked_in') ||
                       roster[0];
        setSelectedApptId(active.id);
        setSearchParams({ apptId: active.id });
      }
    } catch (err: any) {
      console.error('Failed to load appointments/catalog:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to initialize workspace data.' });
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Load consultation data whenever selectedApptId changes
  useEffect(() => {
    if (!selectedApptId) {
      resetWorkspaceFields();
      setSelectedAppt(null);
      return;
    }
    loadConsultationDetails(selectedApptId);
  }, [selectedApptId]);

  const resetWorkspaceFields = () => {
    setBp('');
    setPulse('');
    setTemp('');
    setSpo2('');
    setWeight('');
    setSymptoms('');
    setClinicalNotes('');
    setDiagnosis('');
    setTreatment('');
    setDoctorAdvice('Take medications after food. Maintain hydration. Review if symptoms worsen.');
    setFollowUpDate('');
    setRxItems([]);
    setStatusMsg(null);
    setIssuedRx(null);
  };

  const loadConsultationDetails = async (apptId: string) => {
    setLoadingAppt(true);
    setStatusMsg(null);
    setIssuedRx(null);

    try {
      const data = await apiFetch<any>(`/api/consultations/${apptId}`);
      const appt = data.appointment;
      const consult = data.consultation;
      const prescription = data.prescription;

      setSelectedAppt(appt);

      if (consult) {
        // Load existing saved clinical record
        setBp(consult.vitals_bp || '');
        setPulse(consult.vitals_pulse ? String(consult.vitals_pulse) : '');
        setTemp(consult.vitals_temp ? String(consult.vitals_temp) : '');
        setSpo2(consult.vitals_spo2 ? String(consult.vitals_spo2) : '');
        setWeight(consult.vitals_weight ? String(consult.vitals_weight) : '');
        setSymptoms(consult.symptoms || appt.reason_for_visit || '');
        setClinicalNotes(consult.clinical_notes || '');
        setDiagnosis(consult.diagnosis || '');
        setTreatment(consult.treatment_recommendations || '');
        setDoctorAdvice(consult.doctor_advice || 'Take medications after food. Maintain hydration. Review if symptoms worsen.');
        setFollowUpDate(consult.follow_up_date || '');
      } else {
        // Fresh record: seed symptoms strictly with student's actual booking reason
        setBp('120/80');
        setPulse('76');
        setTemp('98.6');
        setSpo2('99');
        setWeight('60');
        const initialSymptoms = appt.symptoms_description
          ? `${appt.reason_for_visit} — ${appt.symptoms_description}`
          : appt.reason_for_visit || '';
        setSymptoms(initialSymptoms);
        setClinicalNotes('');
        setDiagnosis('');
        setTreatment('');
        setDoctorAdvice('Take medications after food. Maintain hydration. Review if symptoms worsen.');
        setFollowUpDate('');
      }

      if (prescription && Array.isArray(prescription.items)) {
        setRxItems(
          prescription.items.map((item: any) => ({
            medicine_id: item.medicine_id,
            medicine_name: item.medicine_name || `${item.raw_med_name} (${item.med_strength || ''})`,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route,
            instructions: item.instructions,
            quantity_prescribed: item.quantity_prescribed,
            available_stock: item.total_stock,
          }))
        );
        setIssuedRx(prescription);
      } else {
        setRxItems([]);
      }
    } catch (err: any) {
      console.error('Failed to load consultation details:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Unable to load clinical record.' });
    } finally {
      setLoadingAppt(false);
    }
  };

  const handlePatientChange = (newApptId: string) => {
    setSelectedApptId(newApptId);
    setSearchParams({ apptId: newApptId });
  };

  const handleAddMedicineItem = () => {
    const med = pharmacyMeds.find((m) => m.id === selectedMedId);
    if (!med) return;

    const newItem = {
      medicine_id: med.id,
      medicine_name: `${med.name} (${med.strength})`,
      dosage: itemDosage,
      frequency: itemFrequency,
      duration: itemDuration,
      route: itemRoute,
      instructions: itemInstruction,
      quantity_prescribed: itemQty,
      available_stock: med.total_stock,
    };

    setRxItems((prev) => [...prev, newItem]);
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save clinical notes as draft / in progress
  const handleSaveDraft = async () => {
    if (!selectedApptId) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        vitals_bp: bp,
        vitals_pulse: pulse,
        vitals_temp: temp,
        vitals_spo2: spo2,
        vitals_weight: weight,
        symptoms,
        clinical_notes: clinicalNotes,
        diagnosis: diagnosis || 'Clinical evaluation in progress',
        treatment_recommendations: treatment,
        doctor_advice: doctorAdvice,
        follow_up_date: followUpDate || null,
        prescription_items: rxItems,
        is_draft: true,
      };

      const res = await apiFetch(`/api/consultations/${selectedApptId}/save`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setStatusMsg({
        type: 'success',
        text: 'Clinical notes and vitals saved successfully (Draft). Consultation remains active.',
      });

      if (res.appointment) {
        setSelectedAppt((prev: any) => ({ ...prev, status: res.appointment.status }));
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedApptId ? { ...a, status: res.appointment.status } : a))
        );
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save clinical draft.' });
    } finally {
      setSaving(false);
    }
  };

  // Complete consultation and issue Rx
  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptId) return;

    if (!diagnosis.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Clinical Diagnosis is required to complete and sign this consultation.',
      });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        vitals_bp: bp,
        vitals_pulse: pulse,
        vitals_temp: temp,
        vitals_spo2: spo2,
        vitals_weight: weight,
        symptoms,
        clinical_notes: clinicalNotes,
        diagnosis: diagnosis.trim(),
        treatment_recommendations: treatment,
        doctor_advice: doctorAdvice,
        follow_up_date: followUpDate || null,
        prescription_items: rxItems,
        is_draft: false,
      };

      const res = await apiFetch(`/api/consultations/${selectedApptId}/save`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setStatusMsg({
        type: 'success',
        text: 'Consultation completed and digital prescription transmitted to BIT Pharmacy counter.',
      });

      if (res.prescription) {
        setIssuedRx(res.prescription);
      }

      if (res.appointment) {
        setSelectedAppt((prev: any) => ({ ...prev, status: res.appointment.status }));
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedApptId ? { ...a, status: 'completed' } : a))
        );
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to complete consultation.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-700" />
            <h1 className="text-xl font-bold text-[#0f2942]">OPD Clinical Workspace & Prescription Writer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Doctor: <strong>{user?.name}</strong> • Record vital signs, physical examination, clinical diagnosis, and issue prescriptions.
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-600">Select Patient:</span>
          <select
            value={selectedApptId}
            onChange={(e) => handlePatientChange(e.target.value)}
            disabled={loadingList}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium shadow-2xs focus:outline-teal-600 cursor-pointer"
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                Tk #{a.token_number} - {a.student_name} ({a.time_slot}) [{a.status.replace('_', ' ')}]
              </option>
            ))}
            {appointments.length === 0 && <option value="">No patients in queue</option>}
          </select>

          <button
            type="button"
            onClick={loadAppointmentsAndCatalog}
            title="Refresh patient list"
            className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {issuedRx && (
              <button
                type="button"
                onClick={() => setIssuedRx(issuedRx)}
                className="text-xs font-bold text-teal-800 underline flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View / Print Prescription</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {loadingAppt ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
          <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading patient clinical record and appointment details...</p>
        </div>
      ) : selectedAppt ? (
        <form onSubmit={handleSubmitConsultation} className="space-y-6">
          {/* Patient Card Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex flex-col items-center justify-center font-mono shrink-0 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-teal-600">Token</span>
                  <span className="text-base font-black">#{selectedAppt.token_number}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-semibold">{selectedAppt.appointment_number}</span>
                    <StatusBadge status={selectedAppt.status} size="sm" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{selectedAppt.student_name}</h2>
                  <div className="text-xs text-slate-600">
                    Roll: <strong className="font-mono text-[#0f2942]">{selectedAppt.student_roll}</strong> • Dept: {selectedAppt.student_department || 'Engineering'} ({selectedAppt.student_year || 'UG'})
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-center">
                  <span className="text-[10px] text-rose-500 uppercase block font-semibold">Blood Group</span>
                  <span className="font-bold text-rose-700">{selectedAppt.student_blood_group || 'O+'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Scheduled Slot</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedAppt.appointment_date} • {selectedAppt.time_slot}</span>
                </div>
                {selectedAppt.hostel_block && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Hostel Room</span>
                    <span className="font-bold text-slate-800">{selectedAppt.hostel_block} - {selectedAppt.room_no || 'NA'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actual Student's Reason for Consultation */}
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs">
              <span className="font-bold text-teal-900 uppercase text-[10px] tracking-wider block mb-0.5">
                Chief Complaint / Reason for Consultation (Entered by Student):
              </span>
              <p className="text-slate-800 text-sm font-semibold italic">
                "{selectedAppt.reason_for_visit}"
              </p>
              {selectedAppt.symptoms_description && (
                <p className="text-slate-600 text-xs mt-1">
                  <strong>Additional Symptoms Details:</strong> {selectedAppt.symptoms_description}
                </p>
              )}
            </div>

            {/* Known Allergies Warning if present */}
            {selectedAppt.known_allergies && (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Known Patient Allergies:</strong> {selectedAppt.known_allergies}</span>
              </div>
            )}
          </div>

          {/* Section 1: Vital Signs Entry */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>1. Recorded Vital Signs</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Blood Pressure (mmHg)
                </label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="e.g. 120/80"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pulse Rate (bpm)
                </label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="e.g. 74"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Body Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="e.g. 98.6"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Oxygen SpO2 (%)
                </label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="e.g. 99"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 62.5"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Findings & Diagnosis */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <span>2. Clinical Findings & Diagnosis</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Presenting Symptoms & History of Present Illness
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Reported onset, severity, triggers..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Physical Examination & Clinical Observations
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="General condition, auscultation, throat congestion, tenderness..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-teal-900 block mb-1">
                  Clinical Diagnosis * (Required to Complete Consultation)
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Bronchitis, Tension Headache, Allergic Rhinitis"
                  className="w-full px-3 py-2 text-xs bg-teal-50/50 border border-teal-300 rounded-lg font-semibold text-teal-950 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Follow-up Review Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Treatment Recommendations & Clinical Advice
              </label>
              <textarea
                rows={2}
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Hydration, dietary instructions, rest requirements, red flag warnings..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                General Instructions for Patient
              </label>
              <input
                type="text"
                value={doctorAdvice}
                onChange={(e) => setDoctorAdvice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          {/* Section 3: Digital Prescription Writer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-700" />
                <span>3. Formulate Digital Prescription (Rx)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Directly connected to real-time BIT Pharmacy inventory
              </span>
            </div>

            {/* Add Medicine Control Row */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Select Medication from Pharmacy Formulary
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Select Medicine
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium cursor-pointer"
                  >
                    {pharmacyMeds.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.strength}) • In Stock: {med.total_stock} units [{med.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={itemDosage}
                    onChange={(e) => setItemDosage(e.target.value)}
                    placeholder="e.g. 1 Tablet / 5ml"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={itemFrequency}
                    onChange={(e) => setItemFrequency(e.target.value)}
                    placeholder="e.g. 1-0-1 (After Food)"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={itemDuration}
                    onChange={(e) => setItemDuration(e.target.value)}
                    placeholder="e.g. 3 Days"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Administration Route
                  </label>
                  <select
                    value={itemRoute}
                    onChange={(e) => setItemRoute(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Sublingual">Sublingual</option>
                    <option value="Ophthalmic">Ophthalmic</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Prescribed Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddMedicineItem}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Rx</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prescribed Items Table */}
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">#</th>
                    <th className="px-3.5 py-2.5">Medicine</th>
                    <th className="px-3.5 py-2.5">Dosage & Frequency</th>
                    <th className="px-3.5 py-2.5">Duration</th>
                    <th className="px-3.5 py-2.5 text-right">Qty</th>
                    <th className="px-3.5 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rxItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.medicine_name}</td>
                      <td className="px-3.5 py-2.5 font-medium text-teal-800">{item.dosage} • {item.frequency}</td>
                      <td className="px-3.5 py-2.5 text-slate-700">{item.duration} ({item.route})</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">{item.quantity_prescribed}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRxItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rxItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        No medications added to this prescription yet. Use the formulary selector above to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Saving as Draft keeps the appointment active. Completing marks the consultation finished and transmits the Rx to the BIT Pharmacy counter.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Save Draft Action */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Save Draft Notes</span>
              </button>

              {/* Complete Consultation Action */}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>{saving ? 'Completing...' : 'Complete Consultation & Issue Rx'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No patient selected for consultation.</p>
          <p className="text-slate-400">Please choose a patient from your appointment roster or OPD queue.</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/doctor/queue"
              className="px-4 py-2 bg-[#008780] hover:bg-[#007C76] text-white font-semibold rounded-lg transition"
            >
              Open OPD Patient Queue
            </Link>
            <Link
              to="/doctor/dashboard"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Prescription Modal for print review */}
      {issuedRx && (
        <PrescriptionModal
          prescription={issuedRx}
          onClose={() => setIssuedRx(null)}
        />
      )}
    </div>
  );
};
