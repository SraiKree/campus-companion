'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  Search,
  Sun,
  Moon,
  UserMinus,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { HostelAdminStudentRow, HostelLeftStudentRow } from '@/lib/hostel';

type Tab = 'active' | 'left';

export default function HostelAdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('active');
  const [active, setActive] = useState<HostelAdminStudentRow[]>([]);
  const [left, setLeft] = useState<HostelLeftStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Route-guard: only users with role='hostel' may view this page.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'hostel') {
      router.replace('/hostel/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load data once the user is confirmed as a hostel admin.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'hostel') return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('No session');

        const headers = { Authorization: `Bearer ${token}` };
        const [activeRes, leftRes] = await Promise.all([
          fetch('/api/hostel/admin/students', { headers }),
          fetch('/api/hostel/admin/left', { headers }),
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
  }, [authLoading, isAuthenticated, user]);

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

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (authLoading || !isAuthenticated || user?.role !== 'hostel') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--ch-bg)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
      </div>
    );
  }

  return (
    <div
      className={`ch-themed min-h-screen flex${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-[288px] flex flex-col p-6 z-20 border-r"
        style={{ backgroundColor: 'var(--ch-sidebar)', borderColor: 'var(--ch-border)' }}
      >
        <div className="mb-8 px-2 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--ch-accent)' }}
          >
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ch-accent)' }}>
              Campus Hub
            </h1>
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--ch-muted)' }}
            >
              Hostel Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setTab('active')}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
            style={{
              backgroundColor: tab === 'active' ? 'var(--ch-nav-active)' : 'transparent',
              border: tab === 'active' ? '1px solid var(--ch-border)' : '1px solid transparent',
            }}
          >
            <Users
              className="w-[18px] h-[18px]"
              style={{ color: tab === 'active' ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
            />
            <span
              className="text-base font-medium"
              style={{ color: tab === 'active' ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
            >
              Active Students
            </span>
          </button>

          <button
            onClick={() => setTab('left')}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
            style={{
              backgroundColor: tab === 'left' ? 'var(--ch-nav-active)' : 'transparent',
              border: tab === 'left' ? '1px solid var(--ch-border)' : '1px solid transparent',
            }}
          >
            <UserMinus
              className="w-[18px] h-[18px]"
              style={{ color: tab === 'left' ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
            />
            <span
              className="text-base font-medium"
              style={{ color: tab === 'left' ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
            >
              Left Students
            </span>
          </button>
        </nav>

        <div
          className="mt-auto rounded-xl p-4 shadow-sm border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="text-white" style={{ backgroundColor: 'var(--ch-accent)' }}>
                {user?.email?.charAt(0)?.toUpperCase() || 'W'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--ch-text)' }}>
                {user?.email || 'Warden'}
              </p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                Hostel Admin
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full text-xs font-bold h-8"
            style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}
            onClick={handleLogout}
          >
            LOGOUT
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-[288px]">
        <header
          className="fixed top-0 right-0 left-[288px] h-20 backdrop-blur-md border-b z-10"
          style={{ backgroundColor: 'var(--ch-header)', borderColor: 'var(--ch-border)' }}
        >
          <div className="h-full px-10 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>
              Hostel Administration
            </h2>
            <button
              onClick={toggleTheme}
              className="no-transition w-10 h-10 rounded-full flex items-center justify-center border"
              style={{
                backgroundColor: isDark ? 'var(--ch-nav-active)' : 'var(--ch-card)',
                borderColor: 'var(--ch-border)',
                color: isDark ? '#ff8d89' : '#e05252',
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="pt-28 pb-12 px-10">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
                Welcome{user?.email ? `, ${user.email}` : ''}
              </h1>
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                Manage active and past hostel residents.
              </p>
            </div>

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
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--ch-muted)' }}
                  >
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
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--ch-muted)' }}
                  >
                    Left Students
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {left.length}
                </p>
              </button>
            </div>

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
        </main>
      </div>
    </div>
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
