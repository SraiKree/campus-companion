'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import TransportLayout from '@/components/layout/TransportLayout';
import { supabase } from '@/lib/supabase';
import { Bus, Map, UserCheck, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';

interface Overview {
  fleet: { total: number; active: number; inactive: number; maintenance: number };
  routes: { total: number; active: number; stops: number };
  coverage: { assigned: number; capacity: number; seatsRemaining: number };
  fees: { collected: number; pending: number; overdue: number; total: number };
  attention: {
    licensesExpiringSoon: Array<{ id: string; full_name: string; license_expiry: string }>;
  };
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function TransportDashboardPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/transport/overview', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load');
        setData(body);
      } catch (e: unknown) {
        setError((e as Error).message);
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

  const collectedPct = data && data.fees.total > 0
    ? Math.round((data.fees.collected / data.fees.total) * 100)
    : 0;

  const cards = [
    {
      href: '/transport/buses',
      icon: Bus,
      label: 'Fleet',
      primary: data ? `${data.fleet.active} active` : '—',
      secondary: data
        ? `${data.fleet.total} total · ${data.fleet.maintenance} in maintenance`
        : '',
    },
    {
      href: '/transport/routes',
      icon: Map,
      label: 'Routes',
      primary: data ? `${data.routes.active} active` : '—',
      secondary: data ? `${data.routes.stops} stops total` : '',
    },
    {
      href: '/transport/assignments',
      icon: UserCheck,
      label: 'Students',
      primary: data ? `${data.coverage.assigned} assigned` : '—',
      secondary: data
        ? `${data.coverage.seatsRemaining} seats free of ${data.coverage.capacity}`
        : '',
    },
    {
      href: '/transport/fees',
      icon: Wallet,
      label: 'Fees',
      primary: data ? formatINR(data.fees.collected) : '—',
      secondary: data
        ? `${collectedPct}% collected · ${formatINR(data.fees.overdue)} overdue`
        : '',
    },
  ];

  return (
    <TransportLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Transport Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Operational overview of buses, routes, students, and fees.
          </p>
        </div>

        {error && (
          <div
            className="rounded-md border p-3 text-sm"
            style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <Link key={c.href} href={c.href}>
              <div
                className="rounded-2xl border p-5 hover:shadow-md transition-shadow"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(224,82,82,0.1)' }}
                  >
                    <c.icon className="w-5 h-5" style={{ color: 'var(--ch-accent)' }} />
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
                </div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--ch-muted)' }}
                >
                  {c.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {fetching ? '…' : c.primary}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                  {c.secondary}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {data && (
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--ch-muted)' }}>
              Fee Collection
            </h2>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${collectedPct}%`, backgroundColor: 'var(--ch-accent)' }}
                />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                {collectedPct}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Collected</p>
                <p className="font-bold" style={{ color: 'var(--ch-text)' }}>{formatINR(data.fees.collected)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Pending</p>
                <p className="font-bold" style={{ color: 'var(--ch-text)' }}>{formatINR(data.fees.pending)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Overdue</p>
                <p className="font-bold" style={{ color: '#dc2626' }}>{formatINR(data.fees.overdue)}</p>
              </div>
            </div>
          </div>
        )}

        {data && data.attention.licensesExpiringSoon.length > 0 && (
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" style={{ color: '#e05252' }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                Attention — licenses expiring soon
              </h2>
            </div>
            <ul className="space-y-2 text-sm">
              {data.attention.licensesExpiringSoon.map(d => (
                <li key={d.id} className="flex justify-between">
                  <span style={{ color: 'var(--ch-text)' }}>{d.full_name}</span>
                  <span style={{ color: 'var(--ch-muted)' }}>
                    expires {new Date(d.license_expiry).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </TransportLayout>
  );
}
