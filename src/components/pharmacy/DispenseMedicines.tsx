import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Prescription } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PrescriptionModal } from '../common/PrescriptionModal';
import {
  FileCheck2,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Pill,
  Printer,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react';

export const DispenseMedicines: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('BIT-RX-2026-0089');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalRx, setModalRx] = useState<Prescription | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Prescription[]>('/api/prescriptions');
      setPrescriptions(data);
      if (data.length > 0) {
        setSelectedRx(data[0]);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setFeedback(null);
    setLoading(true);
    try {
      const results = await apiFetch<Prescription[]>(`/api/prescriptions?search=${encodeURIComponent(searchQuery.trim())}`);
      setPrescriptions(results);
      if (results.length > 0) {
        setSelectedRx(results[0]);
      } else {
        setSelectedRx(null);
        setFeedback({ type: 'error', text: 'No prescription matching this code or roll number found.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Search failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (prescriptionId: string) => {
    setDispensing(true);
    setFeedback(null);

    try {
      const res = await apiFetch(`/api/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST',
      });

      setFeedback({ type: 'success', text: res.message });
      // Reload prescription
      const updated = await apiFetch<Prescription>(`/api/prescriptions/${prescriptionId}`);
      setSelectedRx(updated);
      setModalRx(updated);
      await loadPrescriptions();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Dispensing failed.' });
    } finally {
      setDispensing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Prescription Verification & Medicine Dispensing</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify digital doctor prescriptions, inspect batch expiries, and record pharmaceutical stock deductions.
        </p>
      </div>

      {/* Prescription Lookup Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Prescription Code (e.g. BIT-RX-2026-0089) or Student Roll..."
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Prescription'}
          </button>
        </form>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Dispensing Desk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Prescription Queue List */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-[#0f2942] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Prescription Queue</span>
            <span className="text-[11px] text-slate-400 font-normal">{prescriptions.length} Records</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {prescriptions.map((rx) => {
              const isSelected = selectedRx?.id === rx.id;
              return (
                <div
                  key={rx.id}
                  onClick={() => {
                    setSelectedRx(rx);
                    setFeedback(null);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0f2942]">{rx.prescription_code}</span>
                    <StatusBadge status={rx.status} size="sm" />
                  </div>
                  <div className="font-semibold text-slate-900">{rx.student_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Roll: {rx.student_roll}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Dr. {rx.doctor_name} • {new Date(rx.issued_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Prescription Verification Sheet */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRx ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-[#0f2942]">
                      {selectedRx.prescription_code}
                    </span>
                    <StatusBadge status={selectedRx.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Issued on {new Date(selectedRx.issued_at).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalRx(selectedRx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Official Prescription View</span>
                </button>
              </div>

              {/* Patient & Prescriber Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Recipient</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedRx.student_name}</div>
                  <div className="text-slate-600 font-mono">Roll: {selectedRx.student_roll}</div>
                  <div className="text-slate-500">{selectedRx.student_department} ({selectedRx.student_year})</div>
                  {selectedRx.blood_group && (
                    <div className="text-rose-700 font-semibold mt-0.5">Blood Group: {selectedRx.blood_group}</div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Prescribing Physician</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedRx.doctor_name}</div>
                  <div className="text-teal-800 font-medium">{selectedRx.doctor_specialization}</div>
                  <div className="text-slate-500">{selectedRx.doctor_qualification || 'Medical Officer'}</div>
                  <div className="text-slate-500 mt-0.5">Room: {selectedRx.opd_room || 'OPD Room 101'}</div>
                </div>
              </div>

              {/* Diagnosis Summary */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Clinical Diagnosis
                </span>
                <div className="p-3 bg-teal-50/50 border border-teal-200/70 rounded-lg text-xs font-bold text-teal-950">
                  {selectedRx.diagnosis_summary}
                </div>
              </div>

              {/* Prescribed Items & Pharmacy Stock Verification Table */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Items for Dispensing & Verification
                </span>

                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Medicine</th>
                        <th className="px-3 py-2.5">Dosage / Schedule</th>
                        <th className="px-3 py-2.5">Instructions</th>
                        <th className="px-3 py-2.5 text-right">Prescribed Qty</th>
                        <th className="px-3 py-2.5 text-center">Batch Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedRx.items?.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/60">
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-900">{item.medicine_name}</div>
                            <div className="text-[10px] text-slate-500">{item.category || item.dosage_form}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-medium text-slate-800">{item.dosage}</span>
                            <span className="text-[11px] font-mono text-teal-700 block">{item.frequency}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-600 italic">
                            {item.instructions}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                            {item.quantity_prescribed}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Active Stock Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {selectedRx.status === 'dispensed' ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Dispensed on {new Date(selectedRx.dispensed_at || '').toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span>
                      Dispensing will atomically deduct batch stock, register a traceable transaction, and seal this prescription.
                    </span>
                  )}
                </div>

                {selectedRx.status !== 'dispensed' && (
                  <button
                    onClick={() => handleDispense(selectedRx.id)}
                    disabled={dispensing}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>{dispensing ? 'Verifying & Dispensing...' : 'Confirm & Dispense Medicines'}</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              Select a prescription from the queue on the left to verify and dispense.
            </div>
          )}
        </div>

      </div>

      {modalRx && (
        <PrescriptionModal
          prescription={modalRx}
          onClose={() => setModalRx(null)}
        />
      )}

    </div>
  );
};
