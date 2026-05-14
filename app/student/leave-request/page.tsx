'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLeaveRequestRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/requests?tab=leave');
  }, [router]);
  return null;
}
