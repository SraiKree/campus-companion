'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Mail, Wallet } from 'lucide-react';

type AppType = 'certificate' | 'leave' | 'fee';

interface AppRow {
  id: string;
  type: AppType;
  student_roll_number: string | null;
  student_name: string | null;
  summary: string;
  status: string;
  timestamp: string;
}

const ICON: Record<AppType, any> = { certificate: FileText, leave: Mail, fee: Wallet };
const FILTERS: Array<AppType | 'all'> = ['all', 'certificate', 'leave', 'fee'];

export default function AdminApplicationsPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<AppType | 'all'>('all');
  const [items, setItems] = useState<AppRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/applications?${params.toString()}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.applications);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const shown = filter === 'all' ? items : items.filter((i) => i.type === filter);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Applications</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Unified timeline of certificate, leave, and fee applications (last 100 of each).
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="flex gap-2"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input className="pl-9" placeholder="Filter by roll or name..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-medium border capitalize"
              style={{
                backgroundColor: filter === f ? 'var(--ch-accent)' : 'var(--ch-card)',
                color: filter === f ? '#fff' : 'var(--ch-muted)',
                borderColor: 'var(--ch-border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : shown.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No applications match.</p>
        ) : (
          <div className="space-y-2">
            {shown.map((a) => {
              const Icon = ICON[a.type];
              return (
                <div
                  key={`${a.type}-${a.id}`}
                  className="rounded-xl p-3 border flex items-center gap-3"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--ch-nav-active)' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--ch-accent)' }}>{a.type}</span>
                      {a.student_roll_number && (
                        <span className="text-xs font-mono" style={{ color: 'var(--ch-muted)' }}>{a.student_roll_number}</span>
                      )}
                      {a.student_name && (
                        <span className="text-sm" style={{ color: 'var(--ch-text)' }}>{a.student_name}</span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--ch-muted)' }}>{a.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold uppercase capitalize" style={{ color: 'var(--ch-accent)' }}>{a.status}</p>
                    <p className="text-[11px]" style={{ color: 'var(--ch-muted)' }}>{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
