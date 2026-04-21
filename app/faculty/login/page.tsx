'use client';

import { BookOpen } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function FacultyLoginPage() {
  return (
    <RoleLogin
      role="faculty"
      title="Faculty Portal"
      subtitle="Sign in to access your classes and tools"
      icon={BookOpen}
    />
  );
}
