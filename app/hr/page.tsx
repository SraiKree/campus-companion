'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import HrLayout from '@/components/layout/HrLayout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Users, UserCheck, UserX, Star, FileText, ArrowRight } from 'lucide-react';

interface Totals {
  employees: number;
  active: number;
  on_leave: number;
  performance_reviews: number;
  documents: number;
}

export default function HrDashboardPage() {
  const { loading, authorized } = useRoleProtection('hr');
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/hr/overview', {
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
    { label: 'Total Employees', value: totals?.employees, Icon: Users, href: '/hr/employees' },
    { label: 'Active', value: totals?.active, Icon: UserCheck, href: '/hr/employees?status=active' },
    { label: 'On Leave', value: totals?.on_leave, Icon: UserX, href: '/hr/employees?status=on-leave' },
    { label: 'Performance Reviews', value: totals?.performance_reviews, Icon: Star, href: '/hr/performance' },
    { label: 'Documents', value: totals?.documents, Icon: FileText, href: '/hr/documents' },
  ];

  return (
    <HrLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>HR Office</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Manage faculty employees, performance reviews, and HR records.
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
    </HrLayout>
  );
}
