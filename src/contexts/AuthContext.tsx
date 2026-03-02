import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types/erp';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo — will be replaced with Supabase auth
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'student@college.edu': {
    password: 'student123',
    user: { id: '1', name: 'Arjun Sharma', email: 'student@college.edu', role: 'student' },
  },
  'faculty@college.edu': {
    password: 'faculty123',
    user: { id: '2', name: 'Dr. Priya Mehta', email: 'faculty@college.edu', role: 'faculty' },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const entry = MOCK_USERS[email];
    if (entry && entry.password === password && entry.user.role === role) {
      setUser(entry.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
