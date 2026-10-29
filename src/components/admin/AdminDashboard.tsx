import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Pill,
  CalendarCheck,
  Radio,
  TrendingDown,
  CalendarX,
  ShieldCheck,
  Settings,
  ArrowRight,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/admin/metrics');
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = metrics?.summary || {};
  const appointmentsByStatus = (metrics?.appointmentsByStatus || []).map((s: any) => ({
    name: s.status.replace(/_/g, ' ').toUpperCase(),
    value: s.count,
  }));

  const consultationsByType = (metrics?.consultationsByType || []).map((c: any) => ({
    name: c.consultation_type === 'online' ? 'Online Telehealth' : 'In-Person OPD',
    value: c.count,
  }));

  const COLORS = ['#142F49', '#008780', '#007C76', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-[#DCE5EE] p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#008780] uppercase tracking-wider">
                BIT Health Center Central Administration
              </span>
              <span className="text-[#DCE5EE]">•</span>
              <span className="text-xs text-[#657D96]">Bannari Amman Institute of Technology</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142F49]">
              Health Center Management & Analytics
            </h1>
            <p className="text-xs text-[#657D96] mt-1">
              Campus epidemiological oversight, doctor OPD rosters, real-time queue tokens, and pharmacy inventory control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#008780] hover:bg-[#007C76] text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Users className="w-4 h-4 text-white" />
              <span>User Management</span>
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#EAF3FA] hover:bg-[#DCE5EE] text-[#142F49] text-xs font-semibold rounded-xl transition shadow-2xs"
            >
              <Settings className="w-4 h-4 text-[#008780]" />
              <span>System Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics 4x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Registered Students</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">{summary.totalStudents || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Enrolled with health records</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Medical Officers</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">{summary.totalDoctors || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Active campus consulting physicians</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Appointments Today</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">{summary.todayAppointments || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">{summary.todayCompleted || 0} consultations completed</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Current Waiting Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 tabular-nums">{summary.todayInQueue || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Patients in OPD queue hall</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Medicines in Catalog</span>
            <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#008780]">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#142F49] tabular-nums">{summary.totalMedicines || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Formulations in pharmacy system</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Low-Stock Warnings</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 tabular-nums">{summary.lowStockCount || 0}</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Below re-order threshold</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">Expired Quarantined</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <CalendarX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tabular-nums">{summary.expiredCount || 0}</div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">Locked from checkout</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#657D96] mb-1">
            <span className="text-xs font-medium">System Integrity</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">100%</div>
          <div className="text-[11px] text-[#657D96] mt-0.5">Audit logging enabled</div>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Appointments by Status */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-2">
            <h2 className="text-xs font-bold text-[#142F49] uppercase tracking-wider">
              Appointments Distribution by Status
            </h2>
            <span className="text-[11px] text-[#657D96]">Total: {summary.todayAppointments || 0}</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {appointmentsByStatus.length === 0 ? (
              <p className="text-xs text-[#657D96]">No appointment records</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#657D96' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#657D96' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#008780" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: In-Person vs Teleconsultation Mode */}
        <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-2">
            <h2 className="text-xs font-bold text-[#142F49] uppercase tracking-wider">
              Consultation Mode Split (OPD vs Online)
            </h2>
          </div>

          <div className="h-64 flex items-center justify-center">
            {consultationsByType.length === 0 ? (
              <p className="text-xs text-[#657D96]">No consultation records</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consultationsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {consultationsByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent System Activities / Audit Trail */}
      <div className="bg-white rounded-2xl border border-[#DCE5EE] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5EE]/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#008780]" />
            <h2 className="text-xs font-bold text-[#142F49] uppercase tracking-wider">
              Recent System & Security Activities
            </h2>
          </div>
          <Link to="/admin/audit-logs" className="text-xs text-[#008780] hover:text-[#007C76] font-semibold">
            View all audit records
          </Link>
        </div>

        <div className="divide-y divide-[#DCE5EE]/60 text-xs">
          {(metrics?.recentAudits || []).map((audit: any) => (
            <div key={audit.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#142F49]">{audit.action}</span>
                <span className="text-[#657D96] ml-2">{audit.details || audit.entity_type}</span>
              </div>
              <div className="text-right text-[11px] text-[#657D96] font-mono">
                {audit.user_name || 'System'} ({audit.user_role || 'system'}) • {new Date(audit.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
