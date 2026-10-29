import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, DoctorProfile, PharmacyProfile } from '../types';

export interface RegisterStudentData {
  name: string;
  register_number: string;
  email: string;
  password: string;
  department: string;
  year_of_study?: string;
  phone?: string;
  gender?: string;
  blood_group?: string;
  hostel_block?: string;
  room_no?: string;
}

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | DoctorProfile | PharmacyProfile | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (data: RegisterStudentData) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLoginAs: (role: 'student' | 'doctor' | 'pharmacy' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bit_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken?: string) => {
    const activeToken = authToken || token || localStorage.getItem('bit_token');

    if (!activeToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        localStorage.removeItem('bit_token');
        setToken(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('bit_token', data.token);
      setToken(data.token);
      await fetchCurrentUser(data.token);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const registerStudent = async (regData: RegisterStudentData) => {
    try {
      const res = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('bit_token', data.token);
      setToken(data.token);
      await fetchCurrentUser(data.token);
      return { success: true, user: data.user, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('bit_token');
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const quickLoginAs = async (role: 'student' | 'doctor' | 'pharmacy' | 'admin') => {
    let identifier = '';
    if (role === 'student') identifier = 'sountharyar.ad23@bitsathy.ac.in';
    else if (role === 'doctor') identifier = 'dr.saravanan@bitsathy.ac.in';
    else if (role === 'pharmacy') identifier = 'pharmacy@bitsathy.ac.in';
    else if (role === 'admin') identifier = 'admin.health@bitsathy.ac.in';

    await login(identifier, 'Password@123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        registerStudent,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
