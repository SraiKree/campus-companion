'use client';

import { ShieldCheck } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function AdminLoginPage() {
  return (
    <RoleLogin
      role="admin"
      title="Admin Portal"
      subtitle="Administrative access to campus systems"
      icon={ShieldCheck}
    />
  );
}
