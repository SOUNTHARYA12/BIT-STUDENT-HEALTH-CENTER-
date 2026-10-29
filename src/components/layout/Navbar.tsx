import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  PhoneCall,
  ShieldCheck,
  FileText,
} from 'lucide-react';

// Institutional Heart & Pulse Logo matching reference design
const BitHealthLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 88C50 88 14 62 14 34C14 20.7452 24.7452 10 38 10C45.2 10 50 14 50 14C50 14 54.8 10 62 10C75.2548 10 86 20.7452 86 34C86 62 50 88 50 88Z"
      fill="#007a78"
    />
    <path
      d="M20 42H38L44 26L54 54L60 38L65 42H80"
      stroke="#ffffff"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const roleLabels: Record<string, string> = {
    student: 'Student',
    doctor: 'Doctor',
    pharmacy: 'Pharmacy Staff',
    admin: 'Administrator',
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Left: Institute & Health Center Branding */}
        <div className="flex items-center gap-3.5">
          <Link to="/" className="flex items-center gap-3.5 group">
            <BitHealthLogo className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-[#0f2942] tracking-tight leading-tight">
                BIT Student Health Center
              </span>
              <span className="text-xs text-slate-500 font-medium leading-tight">
                Bannari Amman Institute of Technology
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                Sathyamangalam
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Campus Emergency Hotline (Visible on md+) */}
        <div className="hidden lg:flex items-center gap-2 bg-teal-50/70 border border-teal-200/60 px-3.5 py-1.5 rounded-full text-xs text-teal-900">
          <PhoneCall className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
          <span className="text-slate-600 font-medium">Campus Medical Emergency:</span>
          <span className="font-mono font-bold text-teal-950">Ext 108 / +91 4295 226000</span>
        </div>

        {/* Right: Notifications & Student Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notification Icon with Red Badge */}
          <button
            type="button"
            onClick={() => {
              if (user?.role === 'student') {
                navigate('/student/notifications');
              }
            }}
            className="relative p-2 text-[#657D96] hover:text-[#142F49] hover:bg-[#EAF3FA] rounded-full transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-1.5 sm:px-2.5 rounded-xl hover:bg-[#EAF3FA] transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 ring-2 ring-[#008780]/30 overflow-hidden shrink-0">
                <img
                  src={
                    user?.role === 'doctor'
                      ? '/src/assets/images/avatar_doctor_1793269858323.jpg'
                      : '/src/assets/images/avatar_student_1793269834316.jpg'
                  }
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#142F49] leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[11px] text-[#657D96] capitalize leading-tight">
                  {user?.role ? roleLabels[user.role] : 'Student'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#657D96] hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#DCE5EE] py-1.5 z-50 animate-in fade-in">
                <div className="px-4 py-2.5 border-b border-[#DCE5EE]/80">
                  <p className="text-xs font-bold text-[#142F49] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#657D96] font-mono truncate">{user?.register_number || user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-[#008780] bg-[#EAF3FA] border border-[#DCE5EE] px-2 py-0.5 rounded">
                    {user?.role ? roleLabels[user.role] : 'Student'}
                  </span>
                </div>

                <div className="py-1 text-xs text-slate-700">
                  {user?.role === 'student' && (
                    <>
                      <Link
                        to="/student/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Health Profile</span>
                      </Link>
                      <Link
                        to="/student/records"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Medical Records (EMR)</span>
                      </Link>
                    </>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
