'use client';

import { UserCog } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function HodLoginPage() {
  return (
    <RoleLogin
      role="hod"
      title="Department Head Portal"
      subtitle="Manage your department's faculty and students"
      icon={UserCog}
    />
  );
}
