'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface HostelAdmin {
  id: string;
  email: string;
  name: string;
  role: 'warden' | 'admin';
}

interface HostelAdminAuthContextType {
  admin: HostelAdmin | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const HostelAdminAuthContext = createContext<HostelAdminAuthContextType | null>(null);

const STORAGE_KEY_TOKEN = 'hostelAdminToken';
const STORAGE_KEY_ADMIN = 'hostelAdminData';

export const HostelAdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<HostelAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    const storedAdmin = sessionStorage.getItem(STORAGE_KEY_ADMIN);
    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_ADMIN);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/hostel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data?.error || 'Login failed' };

      sessionStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      sessionStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(data.admin));
      setToken(data.token);
      setAdmin(data.admin);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_ADMIN);
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <HostelAdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </HostelAdminAuthContext.Provider>
  );
};

export const useHostelAdminAuth = () => {
  const ctx = useContext(HostelAdminAuthContext);
  if (!ctx) throw new Error('useHostelAdminAuth must be used inside HostelAdminAuthProvider');
  return ctx;
};
