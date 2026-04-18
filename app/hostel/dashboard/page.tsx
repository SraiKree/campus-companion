'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserMinus, Search } from 'lucide-react';

import HostelAdminLayout from '@/components/layout/HostelAdminLayout';
import { Input } from '@/components/ui/input';
import { useHostelAdminAuth } from '@/contexts/HostelAdminAuthContext';
import type { HostelAdminStudentRow, HostelLeftStudentRow } from '@/lib/hostel';

type Tab = 'active' | 'left';

export default function HostelAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <HostelAdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
          </div>
        </HostelAdminLayout>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, token, loading: authLoading } = useHostelAdminAuth();

  const initialTab = (searchParams.get('tab') as Tab) === 'left' ? 'left' : 'active';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [active, setActive] = useState<HostelAdminStudentRow[]>([]);
  const [left, setLeft] = useState<HostelLeftStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!admin || !token) router.replace('/hostel/login');
  }, [authLoading, admin, token, router]);

  useEffect(() => {
    const paramTab = (searchParams.get('tab') as Tab) === 'left' ? 'left' : 'active';
    setTab(paramTab);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [activeRes, leftRes] = await Promise.all([
          fetch('/api/hostel/admin/students', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/hostel/admin/left', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const activeData = await activeRes.json();
        const leftData = await leftRes.json();
        if (!activeRes.ok) throw new Error(activeData?.error || 'Failed to load active students');
        if (!leftRes.ok) throw new Error(leftData?.error || 'Failed to load left students');
        setActive(activeData.students || []);
        setLeft(leftData.students || []);
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.room_no.toLowerCase().includes(q) ||
        s.block.toLowerCase().includes(q)
    );
  }, [active, query]);

  const filteredLeft = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return left;
    return left.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.previous_room_no.toLowerCase().includes(q) ||
        s.previous_block.toLowerCase().includes(q)
    );
  }, [left, query]);

  if (authLoading || !admin) {
    return (
      <HostelAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
        </div>
      </HostelAdminLayout>
    );
  }

  return (
    <HostelAdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Welcome, {admin.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
            Manage active and past hostel residents.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTab('active')}
            className="rounded-2xl border p-5 text-left transition-colors"
            style={{
              backgroundColor: tab === 'active' ? 'var(--ch-accent-soft)' : 'var(--ch-card)',
              borderColor: tab === 'active' ? 'var(--ch-accent)' : 'var(--ch-border)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#e05252]" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                Active Students
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              {active.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab('left')}
            className="rounded-2xl border p-5 text-left transition-colors"
            style={{
              backgroundColor: tab === 'left' ? 'var(--ch-accent-soft)' : 'var(--ch-card)',
              borderColor: tab === 'left' ? 'var(--ch-accent)' : 'var(--ch-border)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <UserMinus className="w-5 h-5 text-[#e05252]" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                Left Students
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              {left.length}
            </p>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--ch-muted)' }}
          />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, roll, room…"
            className="pl-10 border"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              color: 'var(--ch-text)',
            }}
          />
        </div>

        {/* Table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-[#e05252]">{error}</div>
          ) : tab === 'active' ? (
            <ActiveTable rows={filteredActive} />
          ) : (
            <LeftTable rows={filteredLeft} />
          )}
        </div>
      </div>
    </HostelAdminLayout>
  );
}

function ActiveTable({ rows }: { rows: HostelAdminStudentRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
        No active hostel students.
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ color: 'var(--ch-muted)' }}>
          <th className="text-left font-medium p-4">Name</th>
          <th className="text-left font-medium p-4">Roll Number</th>
          <th className="text-left font-medium p-4">Department</th>
          <th className="text-left font-medium p-4">Room</th>
          <th className="text-left font-medium p-4">Block</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.roll_number} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
            <td className="p-4 font-medium" style={{ color: 'var(--ch-text)' }}>{r.name}</td>
            <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.roll_number}</td>
            <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.department || '—'}</td>
            <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{r.room_no}</td>
            <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{r.block}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeftTable({ rows }: { rows: HostelLeftStudentRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
        No students have left.
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ color: 'var(--ch-muted)' }}>
          <th className="text-left font-medium p-4">Name</th>
          <th className="text-left font-medium p-4">Roll Number</th>
          <th className="text-left font-medium p-4">Department</th>
          <th className="text-left font-medium p-4">Previous Room</th>
          <th className="text-left font-medium p-4">Previous Block</th>
          <th className="text-left font-medium p-4">Left On</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.roll_number} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
            <td className="p-4 font-medium" style={{ color: 'var(--ch-text)' }}>{r.name}</td>
            <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.roll_number}</td>
            <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.department || '—'}</td>
            <td className="p-4" style={{ color: 'var(--ch-text)' }}>{r.previous_room_no}</td>
            <td className="p-4" style={{ color: 'var(--ch-text)' }}>{r.previous_block}</td>
            <td className="p-4" style={{ color: 'var(--ch-muted)' }}>
              {r.left_at ? new Date(r.left_at).toLocaleDateString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
