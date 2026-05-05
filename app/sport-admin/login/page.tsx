'use client';

import { Trophy } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function SportAdminLoginPage() {
  return (
    <RoleLogin
      role="sport_admin"
      title="Sport Admin Portal"
      subtitle="Sign in to manage campus sports activities"
      icon={Trophy}
    />
  );
}
