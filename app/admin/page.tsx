'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Users, FileText, Eye, Check, Mail, Wallet, ArrowRight } from 'lucide-react';

interface Totals {
  students: number;
  certificates_pending: number;
  certificates_under_review: number;
  certificates_issued: number;
  leave_pending: number;
  fees_pending: number;
}

export default function AdminDashboardPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load');
        setTotals(body.totals);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tiles = [
    { label: 'Total Students', value: totals?.students, Icon: Users, href: '/admin/students' },
    { label: 'Certificates — Pending', value: totals?.certificates_pending, Icon: FileText, href: '/admin/certificates?status=Pending' },
    { label: 'Certificates — Under Review', value: totals?.certificates_under_review, Icon: Eye, href: '/admin/certificates?status=Under%20Review' },
    { label: 'Certificates — Issued', value: totals?.certificates_issued, Icon: Check, href: '/admin/certificates?status=Issued' },
    { label: 'Leave — Pending (view)', value: totals?.leave_pending, Icon: Mail, href: '/admin/applications' },
    { label: 'Fees — Pending (view)', value: totals?.fees_pending, Icon: Wallet, href: '/admin/applications' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Admin Office</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Manage student records, process certificate requests, and track applications.
          </p>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(({ label, value, Icon, href }) => (
            <Link key={label} href={href}>
              <div
                className="rounded-xl p-5 border hover:shadow-sm transition cursor-pointer"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--ch-nav-active)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                      {label}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {fetching ? '—' : (value ?? 0)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
