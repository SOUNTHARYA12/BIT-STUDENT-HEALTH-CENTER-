import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { Prescription } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PrescriptionModal } from '../common/PrescriptionModal';
import {
  FileText,
  Printer,
  Calendar,
  Pill,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const MyPrescriptions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const rxIdParam = searchParams.get('id');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Sync selected prescription with URL param
  useEffect(() => {
    if (rxIdParam && prescriptions.length > 0) {
      const found = prescriptions.find((p) => p.id === rxIdParam);
      if (found) {
        setSelectedRx(found);
      }
    } else if (!rxIdParam) {
      setSelectedRx(null);
    }
  }, [rxIdParam, prescriptions]);

  const handleOpenRx = (rx: Prescription) => {
    setSelectedRx(rx);
    setSearchParams({ id: rx.id });
  };

  const handleCloseRx = () => {
    setSelectedRx(null);
    setSearchParams({});
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Prescription[]>('/api/prescriptions');
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">My Digital Prescriptions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified electronic prescriptions issued by BIT Health Center medical officers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading prescription archives...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-slate-700">No prescriptions issued yet</p>
          <p className="text-slate-400 text-[11px] mt-0.5">Prescriptions created during OPD consultations will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[#0f2942]">{rx.prescription_code}</span>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Issued by: <strong className="text-slate-900">{rx.doctor_name}</strong> ({rx.doctor_specialization})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={rx.status} />
                  <button
                    onClick={() => handleOpenRx(rx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-medium rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-300" />
                    <span>View & Print Rx</span>
                  </button>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="py-3 text-xs">
                <div className="mb-2">
                  <span className="text-slate-400 font-medium">Diagnosis: </span>
                  <span className="font-bold text-slate-800">{rx.diagnosis_summary}</span>
                </div>
                {rx.general_instructions && (
                  <div className="text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                    <strong className="text-slate-700">Doctor Advice:</strong> {rx.general_instructions}
                  </div>
                )}

                {/* Prescribed Medicines Summary */}
                <div className="bg-slate-50/70 rounded-lg border border-slate-200/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prescribed Items ({rx.items?.length || 0})</span>
                  </div>

                  <div className="divide-y divide-slate-200/60">
                    {rx.items?.map((item, idx) => (
                      <div key={item.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{item.medicine_name}</span>
                          <span className="text-[11px] text-slate-500 ml-2 font-mono">({item.dosage} • {item.frequency})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-600">{item.duration}</span>
                          <span className="font-bold text-slate-900 font-mono ml-2">Qty: {item.quantity_prescribed}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dispense footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issued on {new Date(rx.issued_at).toLocaleDateString('en-IN')}</span>
                </div>
                {rx.status === 'dispensed' ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Dispensed at BIT Pharmacy
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Awaiting collection at BIT Pharmacy Counter
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedRx && (
        <PrescriptionModal
          prescription={selectedRx}
          onClose={handleCloseRx}
        />
      )}

    </div>
  );
};
