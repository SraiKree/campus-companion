'use client';

import { Award } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function PrincipalLoginPage() {
  return (
    <RoleLogin
      role="principal"
      title="Principal Portal"
      subtitle="Oversight and approvals across the institution"
      icon={Award}
    />
  );
}
