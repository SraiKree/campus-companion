'use client';

import { Briefcase } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function HrLoginPage() {
  return (
    <RoleLogin
      role="hr"
      title="HR Portal"
      subtitle="Manage faculty employees, performance, and documents"
      icon={Briefcase}
    />
  );
}
