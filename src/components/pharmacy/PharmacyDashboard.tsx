import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import {
  Pill,
  ShieldAlert,
  CalendarX,
  FileCheck2,
  PackagePlus,
  ArrowRight,
  TrendingDown,
  History,
  AlertTriangle,
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<any>({
    lowStock: [],
    expiredBatches: [],
    nearExpiryBatches: [],
  });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [totalMedsCount, setTotalMedsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPharmacyData();
  }, []);

  const loadPharmacyData = async () => {
    setLoading(true);
    try {
      const [alertsData, txnsData, medsData] = await Promise.all([
        apiFetch<any>('/api/pharmacy/alerts'),
        apiFetch<any[]>('/api/pharmacy/transactions?limit=8'),
        apiFetch<any[]>('/api/pharmacy/medicines'),
      ]);

      setAlerts(alertsData);
      setRecentTxns(txnsData);
      setTotalMedsCount(medsData.length);
    } catch (err) {
      console.error('Failed to load pharmacy dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#DCE5EE] p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#008780] uppercase tracking-wider">
                BIT Institutional Pharmacy
              </span>
              <span className="text-[#DCE5EE]">•</span>
              <span className="text-xs text-[#657D96]">License: TN-PHARM-45920</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142F49]">
              Pharmacy Inventory & Dispensing Desk
            </h1>
            <p className="text-xs text-[#657D96] mt-1">
              Continuous batch tracking, prescription verification, stock balance calculation, and expiry safety control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/pharmacy/dispense"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142F49] hover:bg-[#1C3E60] text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <FileCheck2 className="w-4 h-4 text-teal-300" />
              <span>Verify & Dispense Rx</span>
            </Link>
            <Link
              to="/pharmacy/add-medicine"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Inward New Stock</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Medicines */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Catalog Medicines</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">
            {totalMedsCount}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            Active pharmaceutical formulations
          </div>
        </div>

        {/* Low Stock Items Alert */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Low-Stock Items</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 tabular-nums">
            {alerts.lowStock?.length || 0}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            Below institutional threshold
          </div>
        </div>

        {/* Near Expiry Batches */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Near-Expiry Batches</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">
            {alerts.nearExpiryBatches?.length || 0}
          </div>
          <div className="text-[11px] text-[#657D96] mt-1">
            Expiring within 60 days
          </div>
        </div>

        {/* Expired Batches (Prevented from dispensing) */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-2">
            <span className="text-xs font-medium">Expired Batches</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <CalendarX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tabular-nums">
            {alerts.expiredBatches?.length || 0}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            Strictly quarantined & blocked
          </div>
        </div>

      </div>

      {/* Main Grid: Urgent Alerts & Recent Stock Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Critical Stock Alerts */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-[#142F49] uppercase tracking-wider">
                Active Inventory Alerts
              </h2>
            </div>
            <Link to="/pharmacy/alerts" className="text-xs text-[#008780] hover:text-[#007C76] font-semibold">
              All alerts
            </Link>
          </div>

          <div className="space-y-3">
            {/* Expired alert item */}
            {alerts.expiredBatches?.map((b: any) => (
              <div
                key={b.id}
                className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl flex items-center justify-between text-xs text-rose-900"
              >
                <div>
                  <span className="font-bold text-[#142F49]">{b.medicine_name}</span>
                  <div className="text-[11px] text-rose-700 font-mono">
                    Batch: {b.batch_number} • Expired on {b.expiry_date}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold bg-rose-100 px-2 py-0.5 rounded text-rose-900">
                    Expired
                  </span>
                  <div className="font-mono font-bold text-rose-800 text-xs mt-0.5">
                    {b.quantity} {b.unit} quarantined
                  </div>
                </div>
              </div>
            ))}

            {/* Low stock items */}
            {alerts.lowStock?.map((m: any) => (
              <div
                key={m.id}
                className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900"
              >
                <div>
                  <span className="font-bold text-[#142F49]">{m.name}</span>
                  <div className="text-[11px] text-[#657D96]">
                    Shelf: {m.location_shelf} • Min Alert Threshold: {m.min_stock_alert}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold bg-amber-100 px-2 py-0.5 rounded text-amber-900">
                    Low Stock
                  </span>
                  <div className="font-mono font-bold text-amber-800 text-xs mt-0.5">
                    {m.total_stock} {m.unit} remaining
                  </div>
                </div>
              </div>
            ))}

            {(!alerts.expiredBatches?.length && !alerts.lowStock?.length) && (
              <div className="p-8 text-center text-xs text-[#657D96]">
                All medicines are currently within safe operational stock thresholds.
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Stock Movements */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#008780]" />
              <h2 className="text-xs font-bold text-[#142F49] uppercase tracking-wider">
                Recent Stock Movements
              </h2>
            </div>
            <Link to="/pharmacy/transactions" className="text-xs text-[#008780] hover:text-[#007C76] font-semibold">
              View full ledger
            </Link>
          </div>

          {recentTxns.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#657D96]">No stock transactions logged yet.</div>
          ) : (
            <div className="divide-y divide-[#DCE5EE]/60 text-xs">
              {recentTxns.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#142F49]">{t.medicine_name}</div>
                    <div className="text-[11px] text-[#657D96]">
                      {t.reason} • <span className="font-mono">{new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-xs ${
                      t.quantity_change > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change} {t.unit}
                    </span>
                    <div className="text-[10px] text-[#657D96] capitalize">
                      {t.transaction_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
