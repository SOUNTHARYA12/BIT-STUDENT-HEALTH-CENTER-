import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import {
  Settings,
  Building2,
  PhoneCall,
  Clock,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    institution_name: 'Bannari Amman Institute of Technology (BIT)',
    center_name: 'BIT Student Health & Wellness Center',
    center_location: 'Campus Medical Complex, Near Main Hostel Block, BIT Sathyamangalam',
    operating_hours: '24x7 Emergency & OPD: 08:30 AM - 08:00 PM',
    emergency_ambulance: '+91 4295 226000 / Ext 108',
    near_expiry_days_threshold: '60',
    low_stock_default_threshold: '50',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/api/admin/settings');
      const map: Record<string, string> = {};
      data.forEach(item => {
        map[item.key] = item.value;
      });
      setSettings(prev => ({ ...prev, ...map }));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      setMsg({ type: 'success', text: 'System parameters saved and applied campus-wide.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0f2942]">Health Center System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure operational schedules, emergency hotlines, and inventory alert sensitivity.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        <div className="p-6 space-y-5 text-xs">
          
          {/* Institutional Branding */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#0f2942] uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>Institutional Identity</span>
            </h3>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Institution Name</label>
              <input
                type="text"
                value={settings.institution_name}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Health Center Facility Title</label>
              <input
                type="text"
                value={settings.center_name}
                onChange={(e) => setSettings({ ...settings, center_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Campus Physical Location</label>
              <input
                type="text"
                value={settings.center_location}
                onChange={(e) => setSettings({ ...settings, center_location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Operational Hours & Emergency */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-[#0f2942] uppercase tracking-wider text-[11px] flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Operations & Campus Emergency Hotline</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">OPD Operating Hours</label>
                <input
                  type="text"
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Emergency Ambulance Phone</label>
                <input
                  type="text"
                  value={settings.emergency_ambulance}
                  onChange={(e) => setSettings({ ...settings, emergency_ambulance: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pharmacy Alert Thresholds */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-[#0f2942] uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Pharmacy Expiry & Stock Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Near-Expiry Warning Threshold (Days)
                </label>
                <input
                  type="number"
                  value={settings.near_expiry_days_threshold}
                  onChange={(e) => setSettings({ ...settings, near_expiry_days_threshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Batches expiring within this number of days will trigger alerts.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Default Low Stock Minimum (Units)
                </label>
                <input
                  type="number"
                  value={settings.low_stock_default_threshold}
                  onChange={(e) => setSettings({ ...settings, low_stock_default_threshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Baseline threshold for inventory replenishment alerts.</span>
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
