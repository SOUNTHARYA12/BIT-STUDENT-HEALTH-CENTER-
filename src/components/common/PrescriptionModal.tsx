import React, { useEffect } from 'react';
import { Prescription } from '../../types';
import { Printer, X, CheckCircle2, ShieldCheck, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface PrescriptionModalProps {
  prescription: Prescription | null;
  onClose: () => void;
  onDispenseSuccess?: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ prescription, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        // Close if clicked directly on the outer backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Prescription Details"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Action Header (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              title="Return to list (Escape)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back</span>
            </button>
            <span className="text-sm font-bold text-slate-800">Digital Prescription</span>
            <span className="font-mono text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">
              {prescription.prescription_code}
            </span>
            <StatusBadge status={prescription.status} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              aria-label="Close modal"
              title="Close modal (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Paper Body (Printable) */}
        <div className="p-8 text-slate-900">
          
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-[#0f2942] pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
                  Bannari Amman Institute of Technology
                </span>
                <h1 className="text-2xl font-bold text-[#0f2942] tracking-tight">
                  BIT Student Health & Wellness Center
                </h1>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Alathukombai, Sathyamangalam, Erode District, Tamil Nadu - 638401
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Emergency Helpline: +91 4295 226000 | Health Center Ext: 108
                </p>
              </div>

              {/* Institutional Prescription Seal / QR info */}
              <div className="text-right">
                <div className="inline-block p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ref Code</div>
                  <div className="font-mono text-sm font-bold text-[#0f2942]">{prescription.prescription_code}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(prescription.issued_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient & Doctor Two-Column Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-lg border border-slate-200 mb-6 text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student / Patient</div>
              <div className="font-bold text-slate-900 text-base">{prescription.student_name}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Roll No: <span className="font-mono font-medium text-slate-800">{prescription.student_roll || 'N/A'}</span>
              </div>
              <div className="text-xs text-slate-600">
                Department: <span className="font-medium text-slate-800">{prescription.student_department || 'Student'}</span> ({prescription.student_year || ''})
              </div>
              {prescription.blood_group && (
                <div className="text-xs text-slate-600 mt-0.5">
                  Blood Group: <span className="font-bold text-rose-700">{prescription.blood_group}</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Consulting Physician</div>
              <div className="font-bold text-slate-900 text-base">{prescription.doctor_name}</div>
              <div className="text-xs text-teal-800 font-medium">{prescription.doctor_specialization || 'Medical Officer'}</div>
              <div className="text-xs text-slate-600">{prescription.doctor_qualification || 'MBBS'}</div>
              <div className="text-xs text-slate-500 mt-0.5">OPD: {prescription.opd_room || 'Room 101'}</div>
            </div>
          </div>

          {/* Clinical Diagnosis Section */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Diagnosis</div>
            <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-lg text-sm font-medium text-teal-950">
              {prescription.diagnosis_summary}
            </div>
          </div>

          {/* Rx Prescribed Medicines Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-serif italic font-bold text-2xl text-[#0f2942]">℞</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescribed Medication</span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Medicine & Strength</th>
                    <th className="px-4 py-2.5">Dosage / Frequency</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Instructions</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {prescription.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.medicine_name}</div>
                        <div className="text-xs text-slate-500">{item.category || item.dosage_form || 'Tablet'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.dosage}</div>
                        <div className="text-xs font-mono text-teal-700">{item.frequency}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.duration}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 italic">{item.instructions}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                        {item.quantity_prescribed}
                      </td>
                    </tr>
                  ))}
                  {(!prescription.items || prescription.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-500">
                        No individual pharmaceutical items recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doctor Advice / General Instructions */}
          {prescription.general_instructions && (
            <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-0.5">Special Dietary / Rest Instructions:</span>
              {prescription.general_instructions}
            </div>
          )}

          {/* Footer Signatures and Verification */}
          <div className="pt-6 border-t border-slate-200 mt-8 grid grid-cols-2 items-end">
            <div>
              {prescription.status === 'dispensed' ? (
                <div className="inline-flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Dispensed at BIT Health Pharmacy</div>
                    <div className="text-[11px] text-emerald-700">
                      Verified & Issued on {new Date(prescription.dispensed_at || '').toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Present this digital prescription at BIT Health Pharmacy for dispensing.
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="inline-block text-center">
                <div className="h-10 border-b border-slate-400 border-dashed w-48 mb-1 flex items-end justify-center">
                  <span className="font-serif italic text-xs text-slate-500">Digitally Verified & Signed</span>
                </div>
                <div className="font-bold text-xs text-[#0f2942]">{prescription.doctor_name}</div>
                <div className="text-[10px] text-slate-500">Registered Medical Officer, BIT</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer with explicit Return action */}
        <div className="no-print px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition"
          >
            Close & Return to List
          </button>
        </div>

      </div>
    </div>
  );
};
