import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { StockTransaction } from '../../types';
import {
  History,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Calendar,
} from 'lucide-react';

export const StockTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<StockTransaction[]>('/api/pharmacy/transactions?limit=100');
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(t =>
    t.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.reason?.toLowerCase().includes(search.toLowerCase()) ||
    t.reference_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f2942]">Stock Movement Ledger & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable log of every inward receipt, prescription dispensation, and stock adjustment.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine, prescription code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading ledger entries...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No stock movements recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Medicine & Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3 text-right">Prev / New Stock</th>
                <th className="px-4 py-3">Reason / Reference</th>
                <th className="px-4 py-3">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const isInward = t.quantity_change > 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{t.medicine_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{t.medicine_code}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        isInward ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isInward ? <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> : <ArrowUpRight className="w-3 h-3 text-slate-500" />}
                        {t.transaction_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={isInward ? 'text-emerald-700' : 'text-slate-800'}>
                        {isInward ? `+${t.quantity_change}` : t.quantity_change} {t.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      <span>{t.previous_stock} → </span>
                      <strong className="text-slate-900">{t.new_stock}</strong>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div>{t.reason}</div>
                      {t.reference_id && (
                        <span className="font-mono text-[10px] text-teal-800">{t.reference_id}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{t.performed_by_name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{t.performed_by_role}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
