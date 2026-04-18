'use client';

// NOTE: this screen currently renders MOCK data so it can be previewed
// without the hostel-admin backend being ready. To switch to the real
// API later: replace MOCK_ACTIVE / MOCK_LEFT with fetches to
// /api/hostel/admin/students and /api/hostel/admin/left (bearer token
// from supabase.auth.getSession()), and re-enable the role guard.

import { useMemo, useState } from 'react';
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

// ────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────

interface ActiveStudent {
  name: string;
  roll_number: string;
  room_no: string;
  block: string;
}

interface LeftStudent {
  name: string;
  roll_number: string;
  previous_room: string;
  status: 'Left';
}

const MOCK_ACTIVE: ActiveStudent[] = [
  { name: 'Aarav Sharma',       roll_number: '24R01A0501', room_no: '101', block: 'A' },
  { name: 'Bhavya Reddy',       roll_number: '24R01A0502', room_no: '101', block: 'A' },
  { name: 'Chirag Menon',       roll_number: '24R01A0503', room_no: '102', block: 'A' },
  { name: 'Diya Patel',         roll_number: '24R01A0504', room_no: '103', block: 'A' },
  { name: 'Eshaan Kapoor',      roll_number: '24R01A0505', room_no: '201', block: 'B' },
  { name: 'Farhan Iqbal',       roll_number: '24R01A0506', room_no: '201', block: 'B' },
  { name: 'Gauri Nair',         roll_number: '24R01A0507', room_no: '202', block: 'B' },
  { name: 'Harsha Vardhan',     roll_number: '24R01A0508', room_no: '203', block: 'B' },
];

const MOCK_LEFT: LeftStudent[] = [
  { name: 'Isha Raghavan',      roll_number: '23R01A0431', previous_room: '104 / A', status: 'Left' },
  { name: 'Jatin Bose',         roll_number: '23R01A0432', previous_room: '204 / B', status: 'Left' },
  { name: 'Karthik Iyer',       roll_number: '23R01A0433', previous_room: '102 / A', status: 'Left' },
  { name: 'Lavanya Das',        roll_number: '23R01A0434', previous_room: '205 / B', status: 'Left' },
  { name: 'Manav Chatterjee',   roll_number: '23R01A0435', previous_room: '101 / A', status: 'Left' },
  { name: 'Neha Joshi',         roll_number: '23R01A0436', previous_room: '203 / B', status: 'Left' },
];

type Tab = 'active' | 'left';

// ────────────────────────────────────────────────────────────────

export default function HostelAdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');

  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_ACTIVE;
    return MOCK_ACTIVE.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.room_no.toLowerCase().includes(q) ||
        s.block.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredLeft = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_LEFT;
    return MOCK_LEFT.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.previous_room.toLowerCase().includes(q)
    );
  }, [query]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div
      className={`ch-themed min-h-screen flex${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* ── Sidebar (scrollable) ─────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-screen w-[288px] flex flex-col z-20 border-r"
        style={{ backgroundColor: 'var(--ch-sidebar)', borderColor: 'var(--ch-border)' }}
      >
        {/* Logo — fixed at top */}
        <div className="p-6 pb-4 flex items-center gap-3">
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

        {/* Nav — flex-1, scrolls if needed */}
        <nav className="flex-1 overflow-y-auto px-6 space-y-1">
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

        {/* Profile — anchored at bottom */}
        <div
          className="mt-auto m-6 rounded-xl p-4 shadow-sm border"
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

      {/* ── Main ───────────────────────────────────────────────── */}
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

            {/* Interactive stat cards */}
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
                  {MOCK_ACTIVE.length}
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
                  {MOCK_LEFT.length}
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
                placeholder={
                  tab === 'active'
                    ? 'Search by name, roll, room, block…'
                    : 'Search by name, roll, previous room…'
                }
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
              {tab === 'active' ? (
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

// ────────────────────────────────────────────────────────────────

function ActiveTable({ rows }: { rows: ActiveStudent[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
        No matching students.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: 'var(--ch-muted)' }}>
            <th className="text-left font-medium p-4">Name</th>
            <th className="text-left font-medium p-4">Roll Number</th>
            <th className="text-left font-medium p-4">Room Number</th>
            <th className="text-left font-medium p-4">Block</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.roll_number} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
              <td className="p-4 font-medium" style={{ color: 'var(--ch-text)' }}>{r.name}</td>
              <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.roll_number}</td>
              <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{r.room_no}</td>
              <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{r.block}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeftTable({ rows }: { rows: LeftStudent[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
        No matching students.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: 'var(--ch-muted)' }}>
            <th className="text-left font-medium p-4">Name</th>
            <th className="text-left font-medium p-4">Roll Number</th>
            <th className="text-left font-medium p-4">Previous Room</th>
            <th className="text-left font-medium p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.roll_number} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
              <td className="p-4 font-medium" style={{ color: 'var(--ch-text)' }}>{r.name}</td>
              <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{r.roll_number}</td>
              <td className="p-4" style={{ color: 'var(--ch-text)' }}>{r.previous_room}</td>
              <td className="p-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e05252]/10 text-[#e05252]">
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
