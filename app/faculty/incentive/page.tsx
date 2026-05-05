'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Award } from 'lucide-react';

interface Incentive {
  id: string;
  category: string;
  title: string;
  amount: number;
  awarded_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  research: '#7c3aed',
  teaching: '#0ea5e9',
  'extra-duty': '#f59e0b',
  publication: '#10b981',
  patent: '#ef4444',
  event: '#ec4899',
  other: '#64748b',
};

export default function FacultyIncentivePage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/faculty/incentives', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setIncentives(data.incentives);
        setTotal(data.total);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const byCategory: Record<string, number> = {};
  incentives.forEach(i => {
    byCategory[i.category] = (byCategory[i.category] || 0) + Number(i.amount);
  });

  return (
    <FacultyLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <Award className="w-7 h-7" /> Incentives
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Performance-based incentives awarded by HR. Auto-includes in your monthly payslip.
          </p>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--ch-muted)' }}>Total Earned</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ch-accent)' }}>₹{total.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--ch-muted)' }}>Awards</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ch-text)' }}>{incentives.length}</p>
          </div>
          {Object.entries(byCategory).slice(0, 2).map(([cat, amt]) => (
            <div key={cat} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <p className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--ch-muted)' }}>{cat}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ch-text)' }}>₹{amt.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : incentives.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No incentives recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {incentives.map(i => (
              <div key={i.id} className="rounded-xl border p-4 flex justify-between items-start" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: `${CATEGORY_COLORS[i.category] || '#64748b'}20`, color: CATEGORY_COLORS[i.category] || '#64748b' }}>
                      {i.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>{new Date(i.awarded_date).toLocaleDateString()}</span>
                    <span className="text-xs uppercase" style={{ color: 'var(--ch-muted)' }}>· {i.status}</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{i.title}</p>
                  {i.description && <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>{i.description}</p>}
                </div>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--ch-accent)' }}>₹{Number(i.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
