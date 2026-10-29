import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import {
  Pill,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Medicine {
  id: string;
  code: string;
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  unit: string;
  total_stock: number;
  location_shelf: string;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export const StudentMedicines: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchMedicines();
  }, [selectedCategory, search]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      let url = `/api/student/medicines?category=${selectedCategory}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const data = await apiFetch<Medicine[]>(url);
      setMedicines(data);
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'all',
    'Antipyretics & Analgesics',
    'Antibiotics',
    'Antihistamines & Allergy',
    'Gastrointestinal & Antacids',
    'Oral Rehydration & Electrolytes',
    'NSAID / Pain Relief',
    'Topical Antiseptics & Wound Care',
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Medicine Stock & Pharmacy Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time availability of verified OTC medications and prescribed formulary at BIT Health Center dispensary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/student/book"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#007d79] hover:bg-[#006864] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Consult Doctor for Rx</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine name, generic salt, or ailment..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Drug Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicine Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Checking dispensary inventory...
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No medicines found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((m) => {
            const isInStock = m.total_stock > 50;
            const isLow = m.total_stock > 0 && m.total_stock <= 50;
            const isOut = m.total_stock === 0;

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {m.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isInStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isInStock && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {isOut && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>{m.stock_status}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">{m.generic_name}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Form / Strength</span>
                      <span className="text-slate-700 font-medium">{m.dosage_form} • {m.strength}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Dispensary Stock</span>
                      <span className="text-slate-900 font-mono font-bold">
                        {m.total_stock} {m.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>{m.location_shelf}</span>
                  </div>
                  <span className="text-slate-400">{m.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Institutional Notice */}
      <div className="p-4 bg-teal-50/70 border border-teal-200/60 rounded-2xl flex items-center gap-3 text-xs text-teal-900">
        <Building2 className="w-5 h-5 text-teal-700 shrink-0" />
        <div>
          <strong>Pharmacy Policy:</strong> Prescription-grade antibiotics, analgesics, and injectables are dispensed exclusively against verified doctor consultations at the Health Center dispensary counter.
        </div>
      </div>

    </div>
  );
};
