'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import HodLayout from '@/components/layout/HodLayout';
import HodDashboard from '@/components/pages/hod/HodDashboard';

export default function HodReportsPage() {
  const { loading, authorized } = useRoleProtection('hod');
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!authorized) return null;
  return <HodLayout><HodDashboard defaultTab="reports" /></HodLayout>;
}
