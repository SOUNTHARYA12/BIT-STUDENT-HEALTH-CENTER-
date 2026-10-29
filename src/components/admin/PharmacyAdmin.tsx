import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';
import {
  Pill,
  TrendingDown,
  CalendarX,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const PharmacyAdmin: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expiredBatches: [], nearExpiryBatches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [medsData, alertsData] = await Promise.all([
        apiFetch<any[]>('/api/pharmacy/medicines'),
        apiFetch<any>('/api/pharmacy/alerts'),
      ]);
      setMedicines(medsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to load pharmacy overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStockUnits = medicines.reduce((sum, m) => sum + (m.total_stock || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Pharmacy Operations & Stock Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus dispensary inventory compliance, expiration safety, and critical stock alert thresholds.
          </p>
        </div>

        <Link
          to="/pharmacy/inventory"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg transition"
        >
          <span>Open Pharmacy Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Catalog Items</div>
          <div className="text-2xl font-bold text-[#0f2942] mt-1">{medicines.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Distinct medicine formulations</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Stock on Hand</div>
          <div className="text-2xl font-bold text-teal-800 mt-1">{totalStockUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Aggregated units across all shelves</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{alerts.lowStock?.length || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs institutional re-ordering</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Quarantined Expired</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{alerts.expiredBatches?.length || 0}</div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">Discard procedures required</div>
        </div>
      </div>

      {/* Medicines Table Overview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-[#0f2942] uppercase tracking-wider">
            Consolidated Medicine Roster
          </span>
          <span className="text-slate-500">{medicines.length} Registered Drugs</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">Medicine Name</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Strength / Unit</th>
              <th className="px-4 py-2.5">Location Shelf</th>
              <th className="px-4 py-2.5 text-right">Available Stock</th>
              <th className="px-4 py-2.5 text-right">Alert Threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="font-bold text-slate-900">{m.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{m.code}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{m.category}</td>
                <td className="px-4 py-2.5 font-mono text-slate-600">{m.strength} ({m.unit})</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{m.location_shelf || 'Shelf General'}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{m.total_stock}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-500">{m.min_stock_alert}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
