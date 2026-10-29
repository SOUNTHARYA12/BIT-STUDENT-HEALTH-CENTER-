import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CalendarX,
  TrendingDown,
  AlertTriangle,
  PackagePlus,
  MapPin,
  Clock,
} from 'lucide-react';

export const StockAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any>({
    lowStock: [],
    expiredBatches: [],
    nearExpiryBatches: [],
    thresholdDays: 60,
  });
  const [activeTab, setActiveTab] = useState<'low' | 'near_expiry' | 'expired'>('low');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/pharmacy/alerts');
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Medicine Stock & Expiry Safety Alerts</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Proactive monitoring for low catalog thresholds, near-expiry warning windows, and expired stock quarantines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 text-xs">
        <button
          onClick={() => setActiveTab('low')}
          className={`pb-3 font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'low'
              ? 'border-b-2 border-amber-600 text-amber-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-amber-600" />
          <span>Low-Stock Alerts ({alerts.lowStock?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('near_expiry')}
          className={`pb-3 font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'near_expiry'
              ? 'border-b-2 border-sky-600 text-sky-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-sky-600" />
          <span>Near-Expiry Batches ({alerts.nearExpiryBatches?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'expired'
              ? 'border-b-2 border-rose-600 text-rose-800'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <CalendarX className="w-4 h-4 text-rose-600" />
          <span>Expired Batches Quarantined ({alerts.expiredBatches?.length || 0})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Inspecting inventory thresholds...</div>
      ) : (
        <div>
          {/* Low Stock Tab */}
          {activeTab === 'low' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Medicines whose current balance is equal or below defined re-order minimum.
                </span>
                <span className="font-mono">{alerts.lowStock?.length} items require replenishment</span>
              </div>

              {alerts.lowStock?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  All medicines are comfortably above their minimum threshold.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Medicine & Category</th>
                      <th className="px-4 py-3">Location Shelf</th>
                      <th className="px-4 py-3 text-right">Min Threshold</th>
                      <th className="px-4 py-3 text-right">Current Stock</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.lowStock.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.strength} • {m.category}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {m.location_shelf || 'Shelf General'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {m.min_stock_alert} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-800 text-sm">
                          {m.total_stock} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/pharmacy/add-medicine?medId=${m.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Inward Stock</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Near Expiry Tab */}
          {activeTab === 'near_expiry' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-sky-50/60 border-b border-sky-200 flex items-center justify-between text-xs text-sky-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Batches reaching expiration within the next {alerts.thresholdDays} days. Prioritize first-expiry dispensing.
                </span>
                <span className="font-mono">{alerts.nearExpiryBatches?.length} warning batches</span>
              </div>

              {alerts.nearExpiryBatches?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No batches approaching expiry within the threshold window.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Medicine & Code</th>
                      <th className="px-4 py-3">Batch Number</th>
                      <th className="px-4 py-3">Expiry Date</th>
                      <th className="px-4 py-3">Shelf</th>
                      <th className="px-4 py-3 text-right">Batch Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.nearExpiryBatches.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{b.medicine_name}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">{b.batch_number}</td>
                        <td className="px-4 py-3 font-mono text-sky-800 font-bold">{b.expiry_date}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{b.location_shelf}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{b.quantity} {b.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Expired Batches Tab */}
          {activeTab === 'expired' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <CalendarX className="w-4 h-4 text-rose-600" />
                  STRICT SAFETY QUARANTINE: Expired stock is automatically locked from dispensing at checkout.
                </span>
                <span className="font-mono font-bold">{alerts.expiredBatches?.length} quarantined batches</span>
              </div>

              {alerts.expiredBatches?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Zero expired medications in inventory. Compliance 100%.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Medicine Formulation</th>
                      <th className="px-4 py-3">Batch Number</th>
                      <th className="px-4 py-3">Expired On</th>
                      <th className="px-4 py-3">Shelf Quarantine</th>
                      <th className="px-4 py-3 text-right">Quantity Locked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.expiredBatches.map((b: any) => (
                      <tr key={b.id} className="bg-rose-50/30 hover:bg-rose-50/60">
                        <td className="px-4 py-3">
                          <div className="font-bold text-rose-950">{b.medicine_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{b.medicine_code}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-rose-800">{b.batch_number}</td>
                        <td className="px-4 py-3 font-mono text-rose-700 font-bold">{b.expiry_date}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{b.location_shelf}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-900 text-sm">
                          {b.quantity} {b.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
