import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  FileText,
  Pill,
  Bot,
  Bell,
  Stethoscope,
  Radio,
  Clock,
  History,
  ShieldCheck,
  Settings,
  Users,
  PackagePlus,
  FileCheck2,
  ShieldAlert,
  User,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const role = user.role;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Student portal navigation items matching image_e0e304c3.png exactly
  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/book', label: 'Book Appointment', icon: Calendar },
    { to: '/student/appointments', label: 'My Appointments', icon: CalendarCheck },
    { to: '/student/queue', label: 'Live Queue & Tokens', icon: Radio },
    { to: '/student/records', label: 'Medical Records', icon: FileText },
    { to: '/student/medicines', label: 'Medicine Stock', icon: Pill },
    { to: '/student/triage', label: 'AI Health Triage', icon: Bot },
    { to: '/student/notifications', label: 'Notifications', icon: Bell, badge: '3' },
    { to: '/student/profile', label: 'My Profile', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
    { to: '/doctor/appointments', label: "Patient Appointments", icon: CalendarCheck },
    { to: '/doctor/queue', label: 'OPD Patient Queue', icon: Radio },
    { to: '/doctor/workspace', label: 'Clinical Workspace', icon: Stethoscope },
    { to: '/doctor/prescriptions', label: 'Issued Prescriptions', icon: FileText },
    { to: '/doctor/emr', label: 'Patient Medical Records', icon: History },
    { to: '/doctor/profile', label: 'OPD Schedule & Profile', icon: Clock },
  ];

  const pharmacyLinks = [
    { to: '/pharmacy/dashboard', label: 'Pharmacy Dashboard', icon: LayoutDashboard },
    { to: '/pharmacy/inventory', label: 'Medicine Inventory', icon: Pill },
    { to: '/pharmacy/dispense', label: 'Dispense & Verify', icon: FileCheck2 },
    { to: '/pharmacy/add-medicine', label: 'Add Medicine / Inward', icon: PackagePlus },
    { to: '/pharmacy/alerts', label: 'Stock & Expiry Alerts', icon: ShieldAlert, badge: '2' },
    { to: '/pharmacy/transactions', label: 'Stock Movement Ledger', icon: History },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/appointments', label: 'Appointments Oversight', icon: CalendarCheck },
    { to: '/admin/pharmacy', label: 'Pharmacy Health', icon: Pill },
    { to: '/admin/audit-logs', label: 'Audit & Compliance Logs', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Health Center Settings', icon: Settings },
  ];

  let links = studentLinks;
  if (role === 'doctor') links = doctorLinks;
  else if (role === 'pharmacy') links = pharmacyLinks;
  else if (role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#DCE5EE] shrink-0 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between select-none">
      <div className="p-4 space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#008780] text-white shadow-xs'
                    : 'text-[#657D96] hover:text-[#142F49] hover:bg-[#EAF3FA]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Dedicated Logout Action in Sidebar */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#657D96] hover:text-rose-600 hover:bg-rose-50/70 transition-all duration-150 cursor-pointer mt-2"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      {/* Bottom Institutional Brand Lockup matching reference design */}
      <div className="p-6 relative overflow-hidden border-t border-[#DCE5EE]/60 bg-linear-to-b from-white to-[#F5F8FA]">
        <div className="relative z-10">
          <div className="w-12 h-12 mb-2 opacity-25">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 88C50 88 14 62 14 34C14 20.7452 24.7452 10 38 10C45.2 10 50 14 50 14C50 14 54.8 10 62 10C75.2548 10 86 20.7452 86 34C86 62 50 88 50 88Z"
                fill="#008780"
              />
              <path
                d="M20 42H38L44 26L54 54L60 38L65 42H80"
                stroke="#008780"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-sm font-extrabold text-[#142F49] tracking-tight leading-tight">
            Your Health.
          </div>
          <div className="text-sm font-extrabold text-[#008780] tracking-tight leading-tight">
            Our Priority.
          </div>
        </div>
      </div>
    </aside>
  );
};
