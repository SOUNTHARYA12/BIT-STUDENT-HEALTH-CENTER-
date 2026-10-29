import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Stethoscope,
  Video,
  Pill,
  Phone,
  PhoneCall,
  User,
  UserPlus,
  GraduationCap,
  Mail,
  Home,
  HeartPulse,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ChevronRight,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  Sparkles,
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

export const LoginPage: React.FC = () => {
  const { user, login, registerStudent, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  // Mode: Sign In vs Sign Up
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Sign in state
  const [identifier, setIdentifier] = useState('sountharyar.ad23@bitsathy.ac.in');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);

  // Sign up registration state
  const [regName, setRegName] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Artificial Intelligence and Data Science');
  const [regYear, setRegYear] = useState('1st Year B.E/B.Tech');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Female');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regHostelBlock, setRegHostelBlock] = useState('Cauvery Hostel');
  const [regRoomNo, setRegRoomNo] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);

  // Forgot password flow
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const identifierInputRef = useRef<HTMLInputElement>(null);

  // Auto redirect if user session is already established
  useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        student: '/student/dashboard',
        doctor: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(roleRoutes[user.role] || '/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const scrollToLogin = () => {
    const el = document.getElementById('login-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 400);
    }
  };

  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    } else {
      navigate('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanRoll = regRollNo.trim().toUpperCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName || !cleanRoll || !cleanEmail || !regPassword) {
      setError('Please provide your Full Name, Register Number, Institutional Email, and Password.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid institutional email address (e.g. yourname.dept24@bitsathy.ac.in).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    const res = await registerStudent({
      name: cleanName,
      register_number: cleanRoll,
      email: cleanEmail,
      password: regPassword,
      department: regDepartment,
      year_of_study: regYear,
      phone: regPhone ? regPhone.trim() : undefined,
      gender: regGender,
      blood_group: regBloodGroup,
      hostel_block: regHostelBlock,
      room_no: regRoomNo ? regRoomNo.trim() : undefined,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed. Please review your entered details.');
    } else {
      setRegSuccessMsg(res.message || 'Student account registered successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 700);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'doctor' | 'pharmacy' | 'admin') => {
    setError(null);
    setQuickLoginRole(role);
    setLoading(true);
    await quickLoginAs(role);
    setLoading(false);
    setQuickLoginRole(null);
    navigate('/');
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotMsg({ type: 'error', text: data.error || 'User not found in institutional database.' });
      } else {
        setGeneratedCode(data.verificationCode);
        setVerificationCode(data.verificationCode);
        setForgotStep('reset');
        setForgotMsg({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.message || 'Network error occurred.' });
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          verificationCode,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotMsg({ type: 'error', text: data.error || 'Password reset failed.' });
      } else {
        setForgotMsg({ type: 'success', text: data.message });
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep('request');
          setIdentifier(forgotIdentifier);
          setPassword(newPassword);
        }, 1500);
      }
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.message || 'Error occurred.' });
    }
  };

  const onServiceClick = (targetPath: string) => {
    if (user) {
      navigate(targetPath);
    } else {
      scrollToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Header Navigation Bar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left Brand */}
          <div className="flex items-center gap-3.5">
            <BitHealthLogo className="w-11 h-11 shrink-0" />
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
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-6">
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setShowDoctorsModal(true)}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-teal-700" />
                <span>Find a Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => onServiceClick('/student/book')}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>Medical Appointments</span>
              </button>

              <button
                type="button"
                onClick={() => onServiceClick('/student/teleconsult')}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition cursor-pointer"
              >
                <Video className="w-4 h-4 text-teal-700" />
                <span>Online Consultation</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-teal-700" />
                <span>Emergency Contact</span>
              </button>
            </nav>

            <button
              type="button"
              onClick={scrollToLogin}
              className="bg-[#007d79] hover:bg-[#006864] text-white text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Portal Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Hospital Architectural Background */}
      <section
        className="relative bg-cover bg-center overflow-hidden py-10 lg:py-16 border-b border-slate-200/80"
        style={{
          backgroundImage: `url('/assets/bit_hospital_hero.jpg')`,
        }}
      >
        {/* Subtle light overlay for left text clarity while keeping building prominent */}
        <div className="absolute inset-0 bg-linear-to-r from-white/95 via-white/80 to-transparent lg:via-white/50 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Institution Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-teal-200/70 shadow-2xs">
                <span className="text-teal-600 text-[10px]">▶</span>
                <span className="text-[11px] font-bold text-teal-800 tracking-[0.2em] uppercase">
                  Bannari Amman Institute of Technology
                </span>
              </div>

              {/* Main Headline */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0f2942] tracking-tight leading-[1.08]">
                  Your Health.
                </h1>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#008b8b] tracking-tight leading-[1.08] mt-1">
                  Our Priority.
                </h1>
              </div>

              {/* Supporting Text */}
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Welcome to the BIT Student Health Center — your campus destination for medical appointments,
                online consultations, prescriptions and student healthcare services.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={scrollToLogin}
                  className="bg-[#007d79] hover:bg-[#006864] text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-md inline-flex items-center gap-2.5 transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In to Health Portal</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToServices}
                  className="bg-white/95 hover:bg-white text-teal-900 border border-teal-300 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-xs inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Explore Medical Services</span>
                  <ChevronRight className="w-4 h-4 text-teal-700" />
                </button>
              </div>

              {/* Campus Credential Highlights */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>OPD Timing: 8:30 AM – 8:00 PM</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>Confidential Student EMR</span>
                </div>
              </div>
            </div>

            {/* Right Side: The White Auth Card (Login & Register) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div
                id="login-card"
                className={`w-full ${authMode === 'register' ? 'max-w-lg' : 'max-w-md'} bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-6 sm:p-7 relative z-10 transition-all duration-200`}
              >
                {/* Card Heading */}
                <div className="flex items-center gap-3.5 mb-5 pb-1">
                  <BitHealthLogo className="w-12 h-12 shrink-0" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0f2942] tracking-tight">
                      {authMode === 'login' ? 'Welcome Back' : 'Student Registration'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {authMode === 'login'
                        ? 'Sign in to your BIT healthcare portal'
                        : 'Create your institutional health record account'}
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {regSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{regSuccessMsg}</span>
                  </div>
                )}

                {/* Mode 1: LOGIN FORM */}
                {authMode === 'login' ? (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Field 1: Email or BIT Register Number */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Email or BIT Register Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            ref={identifierInputRef}
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter your email or register number"
                            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition placeholder:text-slate-400 text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Field 2: Password */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition placeholder:text-slate-400 text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Forgot Password link */}
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setForgotMsg(null);
                              setForgotStep('request');
                              setForgotIdentifier(identifier);
                              setShowForgotModal(true);
                            }}
                            className="text-xs text-teal-700 hover:text-teal-800 font-semibold hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      {/* Full-width Teal Sign In Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-[#007d79] hover:bg-[#006864] text-white font-medium text-sm rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Authenticating...</span>
                          </div>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switch to Register link */}
                    <div className="mt-3 text-center text-xs text-slate-500">
                      <span>Don't have a health center account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setError(null);
                          setRegSuccessMsg(null);
                        }}
                        className="font-bold text-[#008780] hover:text-[#006864] underline transition cursor-pointer"
                      >
                        Sign Up as Student
                      </button>
                    </div>

                    {/* Footer Security Divider */}
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="border-t border-slate-100 w-full" />
                      <span className="bg-white px-3 text-[11px] text-slate-400 font-medium tracking-wide shrink-0">
                        Secure • Private • Institutional
                      </span>
                    </div>

                    {/* Quick 1-Click Role Accounts for Project Evaluators */}
                    <div className="pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                        Quick Evaluator Access (1-Click)
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickLogin('student')}
                          className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md hover:border-teal-500 hover:bg-teal-50/60 text-left transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">Student</span>
                            <span className="text-[9px] text-slate-500">7376231AD101</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickLogin('doctor')}
                          className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md hover:border-teal-500 hover:bg-teal-50/60 text-left transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">Doctor</span>
                            <span className="text-[9px] text-slate-500">Dr. Saravanan</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickLogin('pharmacy')}
                          className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md hover:border-teal-500 hover:bg-teal-50/60 text-left transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">Pharmacy</span>
                            <span className="text-[9px] text-slate-500">M. Senthil</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickLogin('admin')}
                          className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md hover:border-teal-500 hover:bg-teal-50/60 text-left transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">Admin</span>
                            <span className="text-[9px] text-slate-500">Administrator</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Mode 2: REGISTRATION SIGN UP FORM */
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    {/* Row 1: Full Name & Register Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Sountharya R"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          BIT Register No <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={regRollNo}
                            onChange={(e) => setRegRollNo(e.target.value)}
                            placeholder="e.g. 7376241AD105"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition uppercase font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Institutional Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Institutional Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="e.g. student.ad24@bitsathy.ac.in"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mobile Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="e.g. +91 94421 88901"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Department & Year of Study */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Academic Department <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-800"
                        >
                          <option value="Artificial Intelligence and Data Science">AI & Data Science (AIDS)</option>
                          <option value="Computer Science and Engineering">Computer Science & Engg (CSE)</option>
                          <option value="Information Technology">Information Technology (IT)</option>
                          <option value="Electronics and Communication Engineering">Electronics & Comm (ECE)</option>
                          <option value="Electrical and Electronics Engineering">Electrical & Electronics (EEE)</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Biotechnology">Biotechnology</option>
                          <option value="Biomedical Engineering">Biomedical Engineering</option>
                          <option value="Agricultural Engineering">Agricultural Engineering</option>
                          <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Food Technology">Food Technology</option>
                          <option value="Fashion Technology">Fashion Technology</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Year of Study
                        </label>
                        <select
                          value={regYear}
                          onChange={(e) => setRegYear(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-800"
                        >
                          <option value="1st Year B.E/B.Tech">1st Year B.E/B.Tech</option>
                          <option value="2nd Year B.E/B.Tech">2nd Year B.E/B.Tech</option>
                          <option value="3rd Year B.E/B.Tech">3rd Year B.E/B.Tech</option>
                          <option value="4th Year B.E/B.Tech">4th Year B.E/B.Tech</option>
                          <option value="Postgraduate / Research Scholar">Postgraduate / Research</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Gender & Blood Group */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={regGender}
                          onChange={(e) => setRegGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-800"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Blood Group
                        </label>
                        <div className="relative">
                          <HeartPulse className="w-3.5 h-3.5 absolute left-3 top-3 text-rose-500" />
                          <select
                            value={regBloodGroup}
                            onChange={(e) => setRegBloodGroup(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition font-bold text-rose-800"
                          >
                            <option value="O+">O +ve</option>
                            <option value="A+">A +ve</option>
                            <option value="B+">B +ve</option>
                            <option value="AB+">AB +ve</option>
                            <option value="O-">O -ve</option>
                            <option value="A-">A -ve</option>
                            <option value="B-">B -ve</option>
                            <option value="AB-">AB -ve</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Hostel Block & Room No */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hostel / Residence
                        </label>
                        <div className="relative">
                          <Home className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <select
                            value={regHostelBlock}
                            onChange={(e) => setRegHostelBlock(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-800"
                          >
                            <option value="Cauvery Hostel">Cauvery Hostel (Ladies)</option>
                            <option value="Amaravathi Hostel">Amaravathi Hostel (Ladies)</option>
                            <option value="Bhavani Hostel">Bhavani Hostel (Gents)</option>
                            <option value="Noyyal Hostel">Noyyal Hostel (Gents)</option>
                            <option value="Vaigai Hostel">Vaigai Hostel (Gents)</option>
                            <option value="Day Scholar">Day Scholar (Non-Hostel)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Room Number
                        </label>
                        <input
                          type="text"
                          value={regRoomNo}
                          onChange={(e) => setRegRoomNo(e.target.value)}
                          placeholder="e.g. C-312 or NA"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>

                    {/* Row 6: Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Create Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showRegConfirmPassword ? 'text' : 'password'}
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer Note */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>
                        Your health record, allergy profile, and appointment booking credentials are strictly confidential and governed by BIT Health Center policy.
                      </span>
                    </div>

                    {/* Submit Registration Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#008780] hover:bg-[#007C76] text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Student Account...</span>
                        </div>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Create Student Account & Sign In</span>
                        </>
                      )}
                    </button>

                    {/* Switch back to Login link */}
                    <div className="text-center text-xs text-slate-500 pt-1">
                      <span>Already registered with BIT Health Center? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setError(null);
                          setRegSuccessMsg(null);
                        }}
                        className="font-bold text-[#008780] hover:text-[#006864] underline transition cursor-pointer"
                      >
                        Sign In here
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Service Cards (Directly Below Hero) */}
      <section id="services-section" className="py-6 sm:py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Medical Appointments */}
            <div
              onClick={() => onServiceClick('/student/book')}
              className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-teal-50 border border-teal-100/90 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                    Medical Appointments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Book campus medical visits.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-teal-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-teal-700 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Find a Doctor */}
            <div
              onClick={() => setShowDoctorsModal(true)}
              className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-100/90 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-800 transition">
                    Find a Doctor
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore available doctors and specializations.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-sky-700 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Online Consultation */}
            <div
              onClick={() => onServiceClick('/student/teleconsult')}
              className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-violet-50 border border-violet-100/90 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-violet-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-800 transition">
                    Online Consultation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access authorized online consultations.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-violet-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-violet-700 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: Pharmacy Services */}
            <div
              onClick={() => onServiceClick('/student/prescriptions')}
              className="group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100/90 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition">
                    Pharmacy Services
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View prescription and medicine services.
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-emerald-700 transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Emergency Information Bar */}
      <section className="pb-10 pt-2 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#e6f4f2] border border-teal-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            
            {/* Left Emergency Details */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-white text-teal-800 flex items-center justify-center shrink-0 shadow-2xs border border-teal-100">
                <PhoneCall className="w-5 h-5 text-teal-700" />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold text-teal-950 text-sm sm:text-base">
                  Emergency 24/7
                </span>
                <span className="hidden sm:inline text-teal-300 font-light">|</span>
                <span className="font-semibold text-teal-900 text-xs sm:text-sm">
                  Campus Medical Emergency: Ext 108
                </span>
                <span className="text-teal-800/80 text-xs hidden lg:inline">
                  For urgent medical assistance, contact the campus emergency number.
                </span>
              </div>
            </div>

            {/* Right ECG Wave / Button */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {/* Subtle decorative pulse line */}
              <div className="hidden md:flex items-center text-teal-600/70">
                <svg width="90" height="24" viewBox="0 0 90 24" fill="none">
                  <path
                    d="M0 12H20L25 3L32 21L37 10L42 14L45 12H90"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="bg-white/80 hover:bg-white text-teal-900 border border-teal-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                View Protocol
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>BIT Health Center Complex • Bannari Amman Institute of Technology, Sathyamangalam - 638401</span>
          </div>
          <div className="text-slate-400">
            Final Year B.Tech Project • Department of Artificial Intelligence & Data Science
          </div>
        </div>
      </footer>

      {/* MODAL 1: Emergency Contact Details */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-900">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Campus Emergency Medical Service</h3>
                  <p className="text-[11px] text-slate-500">24 Hours / 7 Days On-Campus Care</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl">
                <div className="text-teal-900 font-bold text-sm">Emergency Hotlines</div>
                <div className="mt-1 text-teal-800 space-y-1">
                  <div>• Campus Intercom Ext: <strong className="font-mono text-teal-950">108</strong></div>
                  <div>• Chief Medical Officer Direct: <strong className="font-mono text-teal-950">+91 4295 226000</strong></div>
                  <div>• BIT Health Ambulance Standby: <strong className="font-mono text-teal-950">+91 98427 12345</strong></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                <div className="font-semibold text-slate-900">Physical Location</div>
                <p>Ground Floor, BIT Health Center Wing (Adjacent to Main Academic Block & Sports Complex).</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Equipped with 10 observation beds, minor operation theater, emergency oxygen supply, and first-response trauma kit.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-[#007d79] text-white text-xs font-semibold rounded-lg hover:bg-[#006864]"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Find a Doctor Preview */}
      {showDoctorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">BIT Medical Doctors & Specialists</h3>
                  <p className="text-[11px] text-slate-500">Institutional Faculty Physicians</p>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Dr. K. Saravanan, MBBS, MD</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                    Chief Medical Officer
                  </span>
                </div>
                <div className="text-slate-600">Specialty: General Medicine & Preventive Health</div>
                <div className="text-[11px] text-slate-500">Consultation: Mon - Sat (9:00 AM – 1:30 PM, 4:00 PM – 7:30 PM)</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Dr. S. Kavitha, MBBS, DGO</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                    Senior Physician
                  </span>
                </div>
                <div className="text-slate-600">Specialty: Student Wellness & Women's Health</div>
                <div className="text-[11px] text-slate-500">Consultation: Mon - Fri (10:00 AM – 4:00 PM)</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Dr. P. Vignesh, MBBS</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    Emergency Care
                  </span>
                </div>
                <div className="text-slate-600">Specialty: Sports Injury, Trauma & Triage</div>
                <div className="text-[11px] text-slate-500">Consultation: 24/7 Rotational Campus Duty</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Sign in to book instant OPD token</span>
              <button
                type="button"
                onClick={() => {
                  setShowDoctorsModal(false);
                  scrollToLogin();
                }}
                className="px-4 py-2 bg-[#007d79] text-white text-xs font-semibold rounded-lg hover:bg-[#006864]"
              >
                Sign In to Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Institutional Password */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Reset Institutional Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotMsg && (
              <div
                className={`my-3 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  forgotMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {forgotMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-3 pt-2">
                <p className="text-xs text-slate-600">
                  Enter your registered BIT Roll Number or institutional email address to generate a verification code.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. 7376231AD101"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007d79] hover:bg-[#006864] rounded-lg shadow-xs"
                  >
                    Generate Reset Code
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset} className="space-y-3 pt-2">
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-700">
                  Verification Code: <span className="font-mono font-bold text-teal-800">{generatedCode}</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007d79] hover:bg-[#006864] rounded-lg shadow-xs"
                  >
                    Confirm New Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
