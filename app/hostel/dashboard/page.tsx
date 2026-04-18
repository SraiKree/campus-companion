'use client';

// Placeholder warden dashboard. Once hostel-admin authentication is wired
// up (see app/hostel/login/page.tsx and app/api/hostel/auth/login/route.ts),
// this page should fetch /api/hostel/admin/students and /api/hostel/admin/left
// using the issued token and render active vs. left students.

import Link from 'next/link';
import { ArrowLeft, Building2, Lock } from 'lucide-react';

export default function HostelAdminDashboardPage() {
  return (
    <div
      className="ch-themed min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center shadow-sm"
        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-[#e05252]" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ch-text)' }}>
          Warden Dashboard
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ch-muted)' }}>
          Authentication is not configured yet. Please sign in once warden
          credentials have been provisioned.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/hostel/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#e05252] hover:bg-[#c94545] text-white"
          >
            <Lock className="w-4 h-4" />
            Go to login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: 'var(--ch-muted)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Main login
          </Link>
        </div>
      </div>
    </div>
  );
}
