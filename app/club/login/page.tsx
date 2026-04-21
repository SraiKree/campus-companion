'use client';

import { Users } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function ClubLoginPage() {
  return (
    <RoleLogin
      role="club"
      title="Club Portal"
      subtitle="Sign in to manage your club activities"
      icon={Users}
    />
  );
}
