'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { BookOpen, BookUp, BookDown, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';

interface Overview {
  catalogue: { titles: number; totalCopies: number; availableCopies: number; issuedCopies: number };
  today: { issued: number; returned: number };
  overdue: {
    count: number;
    list: Array<{
      id: string;
      student_roll: string;
      student_name: string | null;
      due_date: string;
      books: { title: string } | null;
    }>;
  };
  fines: { collectedThisMonth: number; unpaid: number };
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function LibraryDashboardPage() {
  const { loading, authorized } = useRoleProtection('library');
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const body = await libraryFetch('/api/library/overview');
        setData(body);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const cards = [
    {
      href: '/library/books',
      icon: BookOpen,
      label: 'Catalogue',
      primary: data ? `${data.catalogue.titles} titles` : '—',
      secondary: data ? `${data.catalogue.totalCopies} copies · ${data.catalogue.availableCopies} on shelf` : '',
    },
    {
      href: '/library/issue',
      icon: BookUp,
      label: 'Issued today',
      primary: data ? `${data.today.issued}` : '—',
      secondary: data ? `${data.catalogue.issuedCopies} currently out` : '',
    },
    {
      href: '/library/return',
      icon: BookDown,
      label: 'Returned today',
      primary: data ? `${data.today.returned}` : '—',
      secondary: data ? `${data.overdue.count} overdue` : '',
    },
    {
      href: '/library/fines',
      icon: Wallet,
      label: 'Fines',
      primary: data ? formatINR(data.fines.collectedThisMonth) : '—',
      secondary: data ? `${formatINR(data.fines.unpaid)} unpaid` : 'this month',
    },
  ];

  return (
    <LibraryLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Library Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Catalogue, today&apos;s activity, overdue, and fine totals.
          </p>
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <Link key={c.href} href={c.href}>
              <div
                className="rounded-2xl border p-5 hover:shadow-md transition-shadow"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(224,82,82,0.1)' }}>
                    <c.icon className="w-5 h-5" style={{ color: 'var(--ch-accent)' }} />
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ch-muted)' }}>{c.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>{fetching ? '…' : c.primary}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>{c.secondary}</p>
              </div>
            </Link>
          ))}
        </div>

        {data && data.overdue.list.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" style={{ color: '#e05252' }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Most Overdue</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {data.overdue.list.map(i => {
                const daysLate = Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000);
                return (
                  <li key={i.id} className="flex justify-between">
                    <span style={{ color: 'var(--ch-text)' }}>
                      <span className="font-mono">{i.student_roll}</span> — {i.books?.title || 'Unknown'}
                    </span>
                    <span style={{ color: '#dc2626' }}>{daysLate} day{daysLate === 1 ? '' : 's'} late</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </LibraryLayout>
  );
}
