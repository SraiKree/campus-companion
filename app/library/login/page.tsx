'use client';

import { BookOpen } from 'lucide-react';
import RoleLogin from '@/components/pages/RoleLogin';

export default function LibraryLoginPage() {
  return (
    <RoleLogin
      role="library"
      title="Library Portal"
      subtitle="Manage books, issues, and fines"
      icon={BookOpen}
    />
  );
}
