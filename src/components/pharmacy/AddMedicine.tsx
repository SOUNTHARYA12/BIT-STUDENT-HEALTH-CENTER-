import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { Medicine } from '../../types';
import {
  PackagePlus,
  Pill,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react';

export const AddMedicine: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedMedId = searchParams.get('medId');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'new_med' | 'inward_batch'>(preselectedMedId ? 'inward_batch' : 'new_med');
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  // New Medicine Form State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Antibiotics');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [unit, setUnit] = useState('tablets');
  const [minAlert, setMinAlert] = useState(50);
  const [shelf, setShelf] = useState('Shelf A-01');

  // Initial batch for new med
  const [initBatchNo, setInitBatchNo] = useState('');
  const [initQty, setInitQty] = useState(100);
  const [initExpiry, setInitExpiry] = useState('');

  // Inward Batch for Existing Medicine State
  const [batchMedId, setBatchMedId] = useState(preselectedMedId || '');
  const [batchNo, setBatchNo] = useState('');
  const [batchQty, setBatchQty] = useState(100);
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchInvoice, setBatchInvoice] = useState('INV-BIT-2026-');

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const data = await apiFetch<Medicine[]>('/api/pharmacy/medicines');
      setMedicines(data);
      if (!batchMedId && data.length > 0) {
        setBatchMedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      await apiFetch('/api/pharmacy/medicines', {
        method: 'POST',
        body: JSON.stringify({
          name,
          generic_name: genericName,
          category,
          dosage_form: dosageForm,
          strength,
          manufacturer,
          unit,
          min_stock_alert: minAlert,
          location_shelf: shelf,
          initial_batch: initBatchNo ? {
            batch_number: initBatchNo,
            quantity: initQty,
            expiry_date: initExpiry,
          } : null,
        }),
      });

      setStatusMsg({ type: 'success', text: `Medicine "${name}" registered in institutional pharmacy catalog.` });
      setTimeout(() => navigate('/pharmacy/inventory'), 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to add medicine.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInwardBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchMedId) return;

    setSubmitting(true);
    setStatusMsg(null);

    try {
      await apiFetch(`/api/pharmacy/medicines/${batchMedId}/batches`, {
        method: 'POST',
        body: JSON.stringify({
          batch_number: batchNo,
          quantity: batchQty,
          expiry_date: batchExpiry,
          invoice_ref: batchInvoice,
        }),
      });

      setStatusMsg({ type: 'success', text: `Batch ${batchNo} (${batchQty} units) inward recorded and inventory updated.` });
      setTimeout(() => navigate('/pharmacy/inventory'), 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to record batch inward.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Pharmacy Catalog & Stock Inward</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Register new pharmaceutical catalog specifications or receive consignment batches into existing stock.
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab('new_med');
            setStatusMsg(null);
          }}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'new_med'
              ? 'border-b-2 border-[#0f2942] text-[#0f2942]'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Register New Medicine Formulation</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('inward_batch');
            setStatusMsg(null);
          }}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'inward_batch'
              ? 'border-b-2 border-[#0f2942] text-[#0f2942]'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock Inward Batch Consignment</span>
        </button>
      </div>

      {/* Form 1: New Medicine */}
      {activeTab === 'new_med' && (
        <form onSubmit={handleCreateMedicine} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Brand / Commercial Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paracetamol 650mg, Augmentin 625"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Generic Chemical Formulation *
                </label>
                <input
                  type="text"
                  required
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Acetaminophen, Amoxicillin + Clavulanic Acid"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Therapeutic Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Antipyretics & Analgesics">Antipyretics & Analgesics</option>
                  <option value="Antihistamines & Allergy">Antihistamines & Allergy</option>
                  <option value="Antacids & Gastrointestinal">Antacids & Gastrointestinal</option>
                  <option value="Electrolytes & Fluids">Electrolytes & Fluids</option>
                  <option value="NSAID / Pain Relief">NSAID / Pain Relief</option>
                  <option value="Topical Antiseptics & Wound Care">Topical Antiseptics & Wound Care</option>
                  <option value="Respiratory & Cough">Respiratory & Cough</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Dosage Form *
                </label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Ointment">Ointment / Gel</option>
                  <option value="Sachet">Sachet / Powder</option>
                  <option value="Drops">Eye/Ear Drops</option>
                  <option value="Injection">Injection</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Strength / Concentration *
                </label>
                <input
                  type="text"
                  required
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="e.g. 650 mg, 10 mg, 5% w/w"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Manufacturer / Brand
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Cipla Ltd, Sun Pharma, Abbott"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="tablets, capsules, bottles, tubes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Minimum Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min={10}
                  value={minAlert}
                  onChange={(e) => setMinAlert(parseInt(e.target.value, 10) || 50)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Storage Shelf / Bin Location
              </label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="e.g. Shelf A-02, Cold Storage Bin C"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Optional initial batch */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Initial Stock Batch (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={initBatchNo}
                    onChange={(e) => setInitBatchNo(e.target.value)}
                    placeholder="e.g. BAT-2026-X1"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Quantity Received</label>
                  <input
                    type="number"
                    value={initQty}
                    onChange={(e) => setInitQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={initExpiry}
                    onChange={(e) => setInitExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-teal-300" />
              <span>{submitting ? 'Registering...' : 'Register Medicine into Catalog'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Form 2: Inward Consignment Batch */}
      {activeTab === 'inward_batch' && (
        <form onSubmit={handleInwardBatch} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 space-y-4 text-xs">
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Select Existing Medicine *
              </label>
              <select
                value={batchMedId}
                onChange={(e) => setBatchMedId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.strength} ({m.category} • Current Stock: {m.total_stock} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Manufacturer Batch Number *
                </label>
                <input
                  type="text"
                  required
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  placeholder="e.g. PCM26C08, AMX26K1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Quantity Received *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={batchQty}
                  onChange={(e) => setBatchQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Batch Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={batchExpiry}
                  onChange={(e) => setBatchExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Supplier Invoice / Inward Challan Ref
                </label>
                <input
                  type="text"
                  value={batchInvoice}
                  onChange={(e) => setBatchInvoice(e.target.value)}
                  placeholder="e.g. INV-BIT-2026-901"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{submitting ? 'Inwarding...' : 'Record Batch Inward & Update Balance'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
