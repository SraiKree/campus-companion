'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/utils/roles';
import type { UserRole } from '@/types/erp';

/**
 * Hook that protects a page to a specific role.
 * - Redirects unauthenticated users to login (`/`).
 * - Redirects authenticated users with the wrong role to their own dashboard.
 * Returns `{ user, loading, authorized }`.
 */
export function useRoleProtection(allowedRole: UserRole) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const authorized = !loading && isAuthenticated && user?.role === allowedRole;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/');
    } else if (user && user.role !== allowedRole) {
      router.push(getDashboardPath(user.role));
    }
  }, [loading, isAuthenticated, user, allowedRole, router]);

  return { user, loading, authorized };
}
