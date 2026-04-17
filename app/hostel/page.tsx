'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import HostelLayout from '@/components/layout/HostelLayout';
import HostelDashboard from '@/components/pages/HostelDashboard';

export default function HostelPage() {
  const { loading, authorized } = useRoleProtection('hostel');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <HostelLayout>
      <HostelDashboard />
    </HostelLayout>
  );
}
