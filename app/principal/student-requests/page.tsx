'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import PrincipalLayout from '@/components/layout/PrincipalLayout';
import PrincipalDashboard from '@/components/pages/PrincipalDashboard';

export default function PrincipalStudentRequestsPage() {
  const { loading, authorized } = useRoleProtection('principal');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <PrincipalLayout>
      <PrincipalDashboard defaultTab="student_requests" />
    </PrincipalLayout>
  );
}
