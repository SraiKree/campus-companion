'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import ManagementLayout from '@/components/layout/ManagementLayout';
import MgmtDashboard from '@/components/pages/management/MgmtDashboard';

export default function ManagementAnalyticsPage() {
  const { loading, authorized } = useRoleProtection('management');
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!authorized) return null;
  return <ManagementLayout><MgmtDashboard defaultTab="analytics" /></ManagementLayout>;
}
