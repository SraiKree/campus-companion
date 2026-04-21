'use client';

import { Bus } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function TransportLoginPage() {
  return (
    <RoleLogin
      role="transport"
      title="Transport Portal"
      subtitle="Manage buses, routes, and student transport"
      icon={Bus}
    />
  );
}
