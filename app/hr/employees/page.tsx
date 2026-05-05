'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import HrLayout from '@/components/layout/HrLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Plus, X } from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  employee_code: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string | null;
  status: string | null;
  date_of_joining: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'rgba(34,197,94,0.12)',
  'on-leave': 'rgba(234,179,8,0.15)',
  resigned: 'rgba(148,163,184,0.18)',
  terminated: 'rgba(220,38,38,0.18)',
};
const STATUS_TEXT: Record<string, string> = {
  active: '#16a34a',
  'on-leave': '#a16207',
  resigned: '#475569',
  terminated: '#dc2626',
};

export default function HrEmployeesPage() {
  const { loading, authorized } = useRoleProtection('hr');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    email: '', full_name: '', employee_code: '', department: '', designation: '',
    employment_type: 'full-time', date_of_joining: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      const res = await fetch(`/api/hr/employees?${params.toString()}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEmployees(data.employees);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, page, statusFilter]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add employee');
      setShowAdd(false);
      setForm({ email: '', full_name: '', employee_code: '', department: '', designation: '', employment_type: 'full-time', date_of_joining: '' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const lastPage = Math.max(1, Math.ceil(total / 50));

  return (
    <HrLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Employees</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              {total.toLocaleString()} total. Faculty staff records linked by email.
            </p>
          </div>
          <Button onClick={() => setShowAdd(v => !v)} className="gap-2">
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAdd ? 'Close' : 'Add Employee'}
          </Button>
        </div>

        {showAdd && (
          <form
            onSubmit={onAdd}
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input required placeholder="Full name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <Input required type="email" placeholder="Email * (must match faculty login)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Employee code (e.g. F-2024-001)" value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} />
              <Input placeholder="Department (e.g. CSE)" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              <Input placeholder="Designation (e.g. Assistant Professor)" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
              <select
                className="h-10 px-3 rounded-md border text-sm"
                style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                value={form.employment_type}
                onChange={e => setForm({ ...form, employment_type: e.target.value })}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="visiting">Visiting</option>
              </select>
              <Input type="date" placeholder="Date of joining" value={form.date_of_joining} onChange={e => setForm({ ...form, date_of_joining: e.target.value })} />
            </div>
            <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Save Employee'}</Button>
          </form>
        )}

        <form onSubmit={onSearch} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input className="pl-9" placeholder="Name / email / code / dept..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select
            className="h-10 px-3 rounded-md border text-sm"
            style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="on-leave">On leave</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
          <Button type="submit">Search</Button>
        </form>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : employees.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No employees found.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Code</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Dept</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Designation</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Type</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>
                      <div className="font-medium">{e.full_name}</div>
                      <div className="text-xs" style={{ color: 'var(--ch-muted)' }}>{e.email}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs" style={{ color: 'var(--ch-muted)' }}>{e.employee_code || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{e.department || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{e.designation || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{e.employment_type || '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: STATUS_COLORS[e.status || ''] || 'rgba(148,163,184,0.18)',
                          color: STATUS_TEXT[e.status || ''] || '#475569',
                        }}
                      >
                        {e.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/hr/employees/${e.id}`}>
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
    </HrLayout>
  );
}
