'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as AppUser, UserRole } from '@/types/erp';
import { isValidRole } from '@/utils/roles';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string, selectedRole?: UserRole) => Promise<boolean>;
  loginStrict: (email: string, password: string, expectedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithRollNumber: (rollNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Store user data in sessionStorage to avoid repeated DB calls
  const storeUserData = (userData: AppUser) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userData', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const getUserFromStorage = (): AppUser | null => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  const clearUserData = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userData');
    }
    setUser(null);
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if we have user data in storage first
        const storedUser = getUserFromStorage();
        if (storedUser && storedUser.id === session.user.id) {
          setUser(storedUser);
          setLoading(false);
          return;
        }

        // If no stored data, we need to fetch from login API response
        // For now, create a basic user object from session
        const basicUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email || '',
          role: 'faculty' as UserRole, // Default, will be updated by login API
        };
        storeUserData(basicUser);
      } else {
        clearUserData();
      }
      setLoading(false);
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const storedUser = getUserFromStorage();
        if (storedUser && storedUser.id === session.user.id) {
          setUser(storedUser);
        } else {
          // Create basic user from session
          const basicUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email || '',
            role: 'faculty' as UserRole,
          };
          storeUserData(basicUser);
        }
      } else {
        clearUserData();
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error checking existing session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithRollNumber = useCallback(async (rollNumber: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rollNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (!data.credentials) {
        return { success: false, error: 'No authentication credentials received' };
      }

      const { email, password: authPassword } = data.credentials;

      // Try signing in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: authPassword
      });

      if (signInError) {
        // User doesn't exist in Supabase Auth yet — sign them up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: authPassword,
          options: {
            data: {
              name: data.user?.name,
              roll_no: data.user?.roll_no,
              role: 'student'
            }
          }
        });

        if (signUpError) {
          console.error('Supabase sign up error:', signUpError);
          return { success: false, error: 'Failed to create account' };
        }

        // Sign in after successful sign-up
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword
        });

        if (retryError) {
          console.error('Supabase sign in after sign up error:', retryError);
          return { success: false, error: 'Failed to establish session' };
        }
      }

      // Store complete user data from login response
      if (data.user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        storeUserData({ ...data.user, id: authUser?.id || data.user.id });
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string, selectedRole?: UserRole): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message, error);
      return false;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return true;
      }

      // Use the role selected at login if provided, otherwise determine from DB
      let role: UserRole = selectedRole || 'faculty';

      if (!selectedRole) {
        const roleFromMetadata = (authUser.user_metadata as any)?.role;
        if (typeof roleFromMetadata === 'string' && isValidRole(roleFromMetadata)) {
          role = roleFromMetadata;
        } else {
          const { data: roleRows } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id);

          const firstValid = (roleRows ?? []).find((r) => r?.role && isValidRole(r.role));
          if (firstValid?.role) {
            role = firstValid.role as UserRole;
          }
        }
      }

      const userData: AppUser = {
        id: authUser.id,
        email: authUser.email || email,
        name: authUser.email || email,
        role,
      };
      storeUserData(userData);
    } catch (error) {
      console.error('Error getting user data after login:', error);
    }

    return true;
  }, []);

  const loginStrict = useCallback(async (email: string, password: string, expectedRole: UserRole) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return { success: false, error: 'Session could not be established.' };
    }

    // Dev master account — single credential that can sign into every role
    // page so we don't need to seed per-role users while iterating.
    const isDevMaster = (authUser.email || email).toLowerCase() === 'keertan.k@gmail.com';

    const userRoles = new Set<UserRole>();
    const metaRole = (authUser.user_metadata as Record<string, unknown> | undefined)?.role;
    if (typeof metaRole === 'string' && isValidRole(metaRole)) {
      userRoles.add(metaRole);
    }
    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);
    for (const row of roleRows ?? []) {
      if (row?.role && isValidRole(row.role)) userRoles.add(row.role);
    }

    if (!isDevMaster && !userRoles.has(expectedRole)) {
      await supabase.auth.signOut();
      clearUserData();
      return {
        success: false,
        error: 'This account is not authorised to sign in on this page.',
      };
    }

    const userData: AppUser = {
      id: authUser.id,
      email: authUser.email || email,
      name: authUser.email || email,
      role: expectedRole,
    };
    storeUserData(userData);
    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    // Log logout activity if user exists
    if (user?.id) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Logout tracking error:', error);
      }
    }

    // Clear stored data first
    clearUserData();

    // Sign out from Supabase — wrap in try/catch so redirect always runs
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase sign out error:', error);
    }

    // Hard redirect to login — use replace so the user can't "back" into a stale dashboard
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, loginStrict, loginWithRollNumber, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
