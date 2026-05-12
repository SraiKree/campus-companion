'use client';

// Hostel Admin Dashboard — preview build on mock data.
// Swap MOCK_* from lib/hostel-mock.ts for fetches to
// /api/hostel/admin/* when the backend is ready.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  MessageSquare,
  Moon,
  Sun,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  MOCK_COMPLAINTS,
  MOCK_ROOMS,
  MOCK_STUDENTS,
  type HostelComplaint,
  type HostelStudent,
} from '@/lib/hostel-mock';
import StatsRow from '@/components/hostel-admin/StatsRow';
import StudentsTab from '@/components/hostel-admin/StudentsTab';
import RoomsTab from '@/components/hostel-admin/RoomsTab';
import ComplaintsTab from '@/components/hostel-admin/ComplaintsTab';
import AccentPicker from '@/components/AccentPicker';

type Tab = 'students' | 'rooms' | 'complaints';

const NAV = [
  { id: 'students',   label: 'Students',   icon: Users },
  { id: 'rooms',      label: 'Rooms',      icon: Building2 },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare },
] as const;

export default function HostelAdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('students');

  // Mutable local copies — "Mark as left" and "Resolve complaint" update state in place.
  const [students, setStudents] = useState<HostelStudent[]>(MOCK_STUDENTS);
  const [complaints, setComplaints] = useState<HostelComplaint[]>(MOCK_COMPLAINTS);

  const blocks = useMemo(() => {
    const set = new Set(MOCK_ROOMS.map(r => r.block));
    return Array.from(set).sort();
  }, []);

  // Stats
  const activeCount = students.filter(s => s.status === 'Active').length;
  const leftCount = students.filter(s => s.status === 'Left').length;

  const availableRooms = useMemo(() => {
    const countByRoom = new Map<string, number>();
    for (const s of students) {
      if (s.status !== 'Active') continue;
      const key = `${s.block}-${s.room_no}`;
      countByRoom.set(key, (countByRoom.get(key) ?? 0) + 1);
    }
    return MOCK_ROOMS.filter(r => {
      const occupied = countByRoom.get(`${r.block}-${r.room_no}`) ?? 0;
      return occupied < r.capacity;
    }).length;
  }, [students]);

  const handleMarkAsLeft = (id: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status: 'Left', left_at: new Date().toISOString() }
          : s
      )
    );
  };

  const handleResolveComplaint = (id: string) => {
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'Resolved' } : c))
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div
      className={`ch-themed min-h-screen flex${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-screen w-[288px] flex flex-col z-20 border-r"
        style={{ backgroundColor: 'var(--ch-sidebar)', borderColor: 'var(--ch-border)' }}
      >
        {/* Logo */}
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

        {/* Nav — scrollable */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-6 space-y-1 pr-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
                style={{
                  backgroundColor: active ? 'var(--ch-nav-active)' : 'transparent',
                  border: active ? '1px solid var(--ch-border)' : '1px solid transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  style={{ color: active ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
                />
                <span
                  className="text-base font-medium"
                  style={{ color: active ? 'var(--ch-accent)' : 'var(--ch-muted)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Profile — anchored */}
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

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 ml-[288px]">
        <header
          className="fixed top-0 right-0 left-[288px] h-20 backdrop-blur-md border-b z-10"
          style={{ backgroundColor: 'var(--ch-header)', borderColor: 'var(--ch-border)' }}
        >
          <div className="h-full px-10 flex items-center justify-between">
            <h2 className="text-lg font-bold capitalize" style={{ color: 'var(--ch-text)' }}>
              {tab}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="no-transition w-10 h-10 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: isDark ? 'var(--ch-nav-active)' : 'var(--ch-card)',
                  borderColor: 'var(--ch-border)',
                  color: isDark ? 'var(--ch-accent)' : 'var(--ch-accent)',
                }}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <AccentPicker />
            </div>
          </div>
        </header>

        <main className="pt-28 pb-12 px-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats — always visible */}
            <StatsRow
              totalStudents={students.length}
              activeCount={activeCount}
              leftCount={leftCount}
              availableRooms={availableRooms}
            />

            {/* Tab content */}
            {tab === 'students' && (
              <StudentsTab
                students={students}
                blocks={blocks}
                onMarkAsLeft={handleMarkAsLeft}
              />
            )}
            {tab === 'rooms' && (
              <RoomsTab rooms={MOCK_ROOMS} students={students} blocks={blocks} />
            )}
            {tab === 'complaints' && (
              <ComplaintsTab complaints={complaints} onResolve={handleResolveComplaint} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
