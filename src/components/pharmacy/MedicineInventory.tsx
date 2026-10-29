import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Medicine } from '../../types';
import { Link } from 'react-router-dom';
import {
  Pill,
  Search,
  Filter,
  Plus,
  Package,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
} from 'lucide-react';

export const MedicineInventory: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Medicine[]>('/api/pharmacy/medicines');
      setMedicines(data);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(medicines.map(m => m.category)))];

  const filtered = medicines.filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.generic_name.toLowerCase().includes(search.toLowerCase()) && !m.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Pharmacy Medicine Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional stock levels, batch numbers, storage shelf locations, and min-stock thresholds.
          </p>
        </div>

        <Link
          to="/pharmacy/add-medicine"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>Add Medicine or Batch</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand name, generic formulation, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0f2942]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Therapeutic Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading medicine catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No medicines match current search and category filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Medicine & Generic Details</th>
                <th className="px-4 py-3">Form & Strength</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Storage Location</th>
                <th className="px-4 py-3 text-right">Stock Balance</th>
                <th className="px-4 py-3 text-center">Batches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((med) => {
                const isLow = med.total_stock <= med.min_stock_alert;
                const isExpanded = expandedMedId === med.id;

                return (
                  <React.Fragment key={med.id}>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{med.name}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {med.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{med.generic_name}</div>
                        <div className="text-[10px] text-teal-800 font-medium mt-0.5">{med.category}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        <div>{med.dosage_form}</div>
                        <div className="font-mono text-[11px] text-slate-500">{med.strength}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {med.manufacturer}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {med.location_shelf || 'Shelf General'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-black text-sm ${
                          isLow ? 'text-amber-800' : 'text-slate-900'
                        }`}>
                          {med.total_stock} {med.unit}
                        </span>
                        {isLow && (
                          <div className="text-[10px] text-amber-700 font-semibold flex items-center justify-end gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Low Stock (&lt;{med.min_stock_alert})
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{med.batches?.length || 0} Batches</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Batch Breakdown Sub-row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Active Batch Ledger for {med.name}</span>
                              <Link
                                to={`/pharmacy/add-medicine?medId=${med.id}`}
                                className="text-teal-700 hover:underline font-semibold text-[10px]"
                              >
                                + Inward New Batch for this Medicine
                              </Link>
                            </div>

                            {(!med.batches || med.batches.length === 0) ? (
                              <p className="text-xs text-slate-400 py-2">No batches recorded for this item.</p>
                            ) : (
                              <div className="overflow-hidden border border-slate-200 rounded">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[9px]">
                                    <tr>
                                      <th className="px-3 py-1.5">Batch Number</th>
                                      <th className="px-3 py-1.5">Received Date</th>
                                      <th className="px-3 py-1.5">Expiry Date</th>
                                      <th className="px-3 py-1.5 text-right">Available Qty</th>
                                      <th className="px-3 py-1.5 text-center">Batch Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {med.batches.map((b) => (
                                      <tr key={b.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{b.batch_number}</td>
                                        <td className="px-3 py-2 text-slate-600">{b.received_date}</td>
                                        <td className="px-3 py-2 font-mono text-slate-800">{b.expiry_date}</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{b.quantity} {med.unit}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                            b.status === 'expired'
                                              ? 'bg-rose-100 text-rose-800'
                                              : b.status === 'near_expiry'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}>
                                            {b.status.replace('_', ' ')}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
