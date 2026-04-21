'use client';

import { Briefcase } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function ManagementLoginPage() {
  return (
    <RoleLogin
      role="management"
      title="Management Portal"
      subtitle="Sign in to access management tools"
      icon={Briefcase}
    />
  );
}
