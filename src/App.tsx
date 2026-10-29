import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard';
import { BookAppointment } from './components/student/BookAppointment';
import { DoctorDirectory } from './components/student/DoctorDirectory';
import { MyAppointments } from './components/student/MyAppointments';
import { LiveQueue } from './components/student/LiveQueue';
import { OnlineConsultation } from './components/student/OnlineConsultation';
import { MyPrescriptions } from './components/student/MyPrescriptions';
import { MedicalRecords } from './components/student/MedicalRecords';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentMedicines } from './components/student/StudentMedicines';
import { AIHealthTriage } from './components/student/AIHealthTriage';
import { StudentNotifications } from './components/student/StudentNotifications';

// Doctor Components
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DoctorAppointments } from './components/doctor/DoctorAppointments';
import { DoctorQueue } from './components/doctor/DoctorQueue';
import { DoctorWorkspace } from './components/doctor/DoctorWorkspace';
import { DoctorTeleconsultation } from './components/doctor/DoctorTeleconsultation';
import { DoctorEMR } from './components/doctor/DoctorEMR';
import { DoctorProfile } from './components/doctor/DoctorProfile';
import { DoctorPrescriptions } from './components/doctor/DoctorPrescriptions';
import { UnauthorizedPage } from './components/auth/UnauthorizedPage';

// Pharmacy Components
import { PharmacyDashboard } from './components/pharmacy/PharmacyDashboard';
import { MedicineInventory } from './components/pharmacy/MedicineInventory';
import { DispenseMedicines } from './components/pharmacy/DispenseMedicines';
import { AddMedicine } from './components/pharmacy/AddMedicine';
import { StockAlerts } from './components/pharmacy/StockAlerts';
import { StockTransactions } from './components/pharmacy/StockTransactions';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { AppointmentManagement } from './components/admin/AppointmentManagement';
import { PharmacyAdmin } from './components/admin/PharmacyAdmin';
import { AuditLogs } from './components/admin/AuditLogs';
import { SystemSettings } from './components/admin/SystemSettings';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying institutional credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname }} replace />;
  }

  return <>{children}</>;
};

const RoleRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes: Record<string, string> = {
    student: '/student/dashboard',
    doctor: '/doctor/dashboard',
    pharmacy: '/pharmacy/dashboard',
    admin: '/admin/dashboard',
  };

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Role-Based Redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Authenticated Layout for All Portals */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/book"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <BookAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/doctors"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <DoctorDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/appointments"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/queue"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <LiveQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/consultation"
              element={<Navigate to="/student/appointments" replace />}
            />
            <Route
              path="/student/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <MyPrescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/records"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/medicines"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentMedicines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/triage"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <AIHealthTriage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/workspace"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorPrescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/teleconsultation"
              element={<Navigate to="/doctor/appointments" replace />}
            />
            <Route
              path="/doctor/emr"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorEMR />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorProfile />
                </ProtectedRoute>
              }
            />

            {/* Pharmacy Routes */}
            <Route
              path="/pharmacy/dashboard"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <PharmacyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/inventory"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <MedicineInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/dispense"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <DispenseMedicines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/add-medicine"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <AddMedicine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/alerts"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <StockAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/transactions"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                  <StockTransactions />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppointmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pharmacy"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PharmacyAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />

            {/* 403 Dedicated Unauthorized Page */}
            <Route
              path="/unauthorized"
              element={<UnauthorizedPage />}
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
