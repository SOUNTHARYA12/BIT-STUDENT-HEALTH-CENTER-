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
  Search,
  Filter,
  User,
} from 'lucide-react';

export const DoctorPrescriptions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'dispensed'>('all');

  const rxIdParam = searchParams.get('id');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (rxIdParam && prescriptions.length > 0) {
      const match = prescriptions.find((p) => p.id === rxIdParam);
      if (match) {
        setSelectedRx(match);
      }
    } else if (!rxIdParam) {
      setSelectedRx(null);
    }
  }, [rxIdParam, prescriptions]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Prescription[]>('/api/prescriptions');
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load doctor prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRx = (rx: Prescription) => {
    setSelectedRx(rx);
    setSearchParams({ id: rx.id });
  };

  const handleCloseRx = () => {
    setSelectedRx(null);
    setSearchParams({});
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.prescription_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.student_roll?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = prescriptions.length;
  const dispensedCount = prescriptions.filter((p) => p.status === 'dispensed').length;
  const pendingCount = prescriptions.filter((p) => p.status === 'issued').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Issued Prescriptions Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Electronic prescriptions authorized during OPD consultations and sent to BIT Pharmacy.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Rx Created</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-[#0f2942] mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Institutional E-Prescriptions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Dispensed by Pharmacy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{dispensedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Medicines handed to student</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Pending Collection</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">At BIT Pharmacy counter</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Rx code, student name, roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({prescriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter('issued')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === 'issued'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('dispensed')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === 'dispensed'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Dispensed ({dispensedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading prescription ledger...</div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-slate-700">No prescriptions found</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {searchQuery || statusFilter !== 'all'
              ? 'Try modifying your search query or filter.'
              : 'Prescriptions issued during consultations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrescriptions.map((rx) => (
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0f2942]">{rx.prescription_code}</span>
                      <StatusBadge status={rx.status} />
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {rx.student_name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">({rx.student_roll || 'Student'})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                {/* Prescribed Items */}
                <div className="bg-slate-50/70 rounded-lg border border-slate-200/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prescribed Medications ({rx.items?.length || 0})</span>
                  </div>

                  <div className="divide-y divide-slate-200/60">
                    {rx.items?.map((item, idx) => (
                      <div key={item.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{item.medicine_name}</span>
                          <span className="text-[11px] text-slate-500 ml-2 font-mono">
                            ({item.dosage} • {item.frequency})
                          </span>
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

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issued on {new Date(rx.issued_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
                {rx.status === 'dispensed' ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Dispensed by {rx.dispensed_by_name || 'BIT Pharmacy Staff'}
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Pending student pickup at BIT Pharmacy Counter
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription View Modal */}
      {selectedRx && (
        <PrescriptionModal
          prescription={selectedRx}
          onClose={handleCloseRx}
        />
      )}
    </div>
  );
};
