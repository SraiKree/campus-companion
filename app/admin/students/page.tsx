'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';

interface Student {
  roll_number: string;
  name: string | null;
  email: string | null;
  department: string | null;
  section: string | null;
  semester: number | null;
  year: number | null;
}

export default function AdminStudentsPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
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
      params.set('page', String(page));
      const res = await fetch(`/api/admin/students?${params.toString()}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setStudents(data.students);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized, page]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const lastPage = Math.max(1, Math.ceil(total / 50));

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Students</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            {total.toLocaleString()} total. Click a row to view full record.
          </p>
        </div>

        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input className="pl-9" placeholder="Roll number / name / email..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No students found.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Dept</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Sec</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Yr / Sem</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.roll_number} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2 font-mono" style={{ color: 'var(--ch-text)' }}>{s.roll_number}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{s.name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{s.department || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{s.section || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{s.year ?? '—'} / {s.semester ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/admin/students/${encodeURIComponent(s.roll_number)}`}>
                        <Button variant="ghost" size="sm">
                          Open <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" disabled={page <= 1 || fetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Page {page} of {lastPage}</p>
            <Button variant="ghost" disabled={page >= lastPage || fetching} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
