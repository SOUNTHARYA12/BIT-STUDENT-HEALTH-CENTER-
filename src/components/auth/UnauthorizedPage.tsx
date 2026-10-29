import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut, Home, Lock } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const attemptedPath = (location.state as any)?.attemptedPath || '';

  const getRoleHome = (role?: string) => {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'pharmacy':
        return '/pharmacy/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'student':
        return 'Student (Patient)';
      case 'doctor':
        return 'Medical Officer (Doctor)';
      case 'pharmacy':
        return 'Pharmacy Staff';
      case 'admin':
        return 'Institutional Administrator';
      default:
        return 'Guest / Unauthenticated';
    }
  };

  const handleReturnHome = () => {
    navigate(getRoleHome(user?.role));
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>

        {/* Status and Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>403 Access Restricted</span>
        </div>

        <h1 className="text-xl font-bold text-[#0f2942] tracking-tight">
          Unauthorized Institutional Section
        </h1>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your current institutional account does not have permission to view or manage resources in this portal.
        </p>

        {attemptedPath && (
          <div className="mt-3 py-1.5 px-3 bg-slate-100 rounded-lg text-slate-600 text-xs font-mono inline-block max-w-full truncate">
            Attempted: {attemptedPath}
          </div>
        )}

        {/* Current User Role Box */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
          <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
            Authenticated Account Details
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Logged in as:</span>
            <span className="font-semibold text-slate-900">{user?.name || 'Authorized User'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Institutional Role:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold capitalize">
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">BIT Identifier:</span>
            <span className="font-mono text-slate-700">{user?.register_number || user?.email}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleReturnHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f2942] hover:bg-[#163654] text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Home className="w-4 h-4 text-teal-300" />
            <span>Return to My Authorized Portal</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-xl transition"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign In with Different Account</span>
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          All portal navigation attempts are monitored for compliance with BIT Institutional IT & Health Informatics Policy.
        </div>
      </div>
    </div>
  );
};
