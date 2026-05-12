'use client';

import { ReactNode, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search, Home, BookOpen, Calendar, Users, Sun, Moon, MessageSquarePlus, Building2,
  Send, MessageSquare, Wallet, Award, CalendarDays, Trophy, Library, Mail, Bus, Briefcase,
  FileSignature, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useWorkspaceTransition } from '@/hooks/useWorkspaceTransition';
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import NotificationPanel from '@/components/NotificationPanel';
import AccentPicker from '@/components/AccentPicker';

interface StudentLayoutProps {
  children: ReactNode;
}

// ── Nav item config split by workspace ──────────────────────────────────────
const educationNav = [
  { href: '/student', label: 'Dashboard', icon: Home },
  { href: '/student/courses', label: 'Courses', icon: BookOpen },
  { href: '/student/attendance', label: 'Attendance', icon: Calendar },
  { href: '/student/academic-planning', label: 'Academic Planning', icon: CalendarDays },
  { href: '/student/projects', label: 'Projects', icon: ClipboardCheck },
  { href: '/student/lor', label: 'LOR Requests', icon: FileSignature },
  { href: '/student/learning-resources', label: 'Learning Resources', icon: Library },
  { href: '/student/announcements', label: 'Announcements', icon: Users },
];

const adminNav = [
  { href: '/student', label: 'Dashboard', icon: Home },
  { href: '/student/hostel', label: 'Hostel', icon: Building2 },
  { href: '/student/transport', label: 'Transport', icon: Bus },
  { href: '/student/sports', label: 'Sports & Activities', icon: Trophy },
  { href: '/student/fees', label: 'Fee Payment', icon: Wallet },
  { href: '/student/admin-accounts', label: 'Admin & Accounts', icon: Briefcase },
  { href: '/student/certificates', label: 'Certificates', icon: Award },
  { href: '/student/leave-request', label: 'Leave Request', icon: Mail },
  { href: '/student/complaints', label: 'Complaints', icon: MessageSquarePlus },
  { href: '/student/requests', label: 'Raise Request', icon: Send },
  { href: '/student/feedback', label: 'Faculty Feedback', icon: MessageSquare },
];

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { workspace, toggleWorkspace, setDragOffset, dragOffset } = useWorkspace();
  const pathname = usePathname();

  // Nav transition: key change forces React remount, CSS @keyframes handles fade-in.
  // This avoids the .ch-themed * transition override that breaks inline opacity/transform.

  // ── Keyboard shortcut: Ctrl+Shift+Arrow ────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        toggleWorkspace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleWorkspace]);

  // ── Swipe gesture ──────────────────────────────────────────────────────
  const onDrag = useCallback((dx: number) => setDragOffset(dx), [setDragOffset]);

  const swipeHandlers = useSwipeGesture({
    threshold: 80,
    onDrag,
    onSwipeRight: () => {
      // Swipe right → education
      if (workspace === 'admin') toggleWorkspace();
    },
    onSwipeLeft: () => {
      // Swipe left → admin
      if (workspace === 'education') toggleWorkspace();
    },
  });

  // ── Workspace transition (fade-out → swap → fade-in + tab memory) ────
  const {
    displayedWorkspace,
    navAnimClass,
    contentAnimClass,
    handleAnimEnd,
  } = useWorkspaceTransition('/student', educationNav, adminNav);

  const navItems = displayedWorkspace === 'education' ? educationNav : adminNav;

  const isActive = (href: string) => {
    if (href === '/student') return pathname === href;
    return pathname?.startsWith(href);
  };

  const isEducation = workspace === 'education';

  // ── Theme tokens ─────────────────────────────────────────────────
  // Every accent-derived color reads from a single CSS variable so the
  // entire layout follows whatever primary color is active.
  const wsAccent      = 'var(--ch-accent)';
  const wsSidebarBg   = 'var(--ch-sidebar)';
  const wsBorderColor = 'var(--ch-border)';
  const wsNavActive   = 'var(--ch-accent-soft)';
  const wsHover       = 'var(--ch-accent-softer)';

  return (
    <div
      className={`ch-themed min-h-screen flex${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        {...swipeHandlers}
        className="fixed left-0 top-0 h-screen w-[288px] flex flex-col p-6 z-20 select-none"
        style={{
          backgroundColor: wsSidebarBg,
          borderRight: `1px solid ${wsBorderColor}`,
          transform: dragOffset ? `translateX(${dragOffset * 0.15}px)` : undefined,
          transition: dragOffset ? 'none' : 'transform 0.3s ease-out, background-color 0.35s ease, border-color 0.35s ease',
          touchAction: 'pan-y',
        }}
      >
        {/* Logo */}
        <div className="mb-4 px-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: wsAccent }}
            >
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight transition-colors duration-300"
                style={{ color: wsAccent }}
              >
                Campus Hub
              </h1>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--ch-muted)' }}
              >
                Student Portal
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="mb-4 px-1">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation — scrolls if nav items overflow vertically */}
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 -mr-1">
          <div className={`no-transition ${navAnimClass} space-y-1`} onAnimationEnd={handleAnimEnd}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: active ? wsNavActive : 'transparent',
                      border: active ? `1px solid ${wsBorderColor}` : '1px solid transparent',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = wsHover;
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon
                      className="w-[18px] h-[18px] transition-colors duration-300"
                      style={{ color: active ? wsAccent : 'var(--ch-muted)' }}
                    />
                    <span
                      className="text-base font-medium transition-colors duration-300"
                      style={{ color: active ? wsAccent : 'var(--ch-muted)' }}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Swipe hint */}
        <div className="flex justify-center py-2">
          <div
            className="inline-flex items-center rounded-full border px-3 py-1.5 backdrop-blur-sm"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--ch-text)' }}>
              Swipe sidebar or press Ctrl+Shift+Arrow
            </p>
          </div>
        </div>

        {/* User Profile */}
        <div
          className="mt-auto rounded-xl p-4 shadow-sm border"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder-avatar.png" />
              <AvatarFallback style={{ backgroundColor: wsAccent }} className="text-white transition-colors duration-300">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p
                className="text-sm font-bold truncate"
                style={{ color: 'var(--ch-text)' }}
              >
                {user?.name || 'Student'}
              </p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                ID: #{user?.id || '000000'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full text-xs font-bold h-8"
            style={{
              backgroundColor: 'var(--ch-muted-bg)',
              color: 'var(--ch-text)',
            }}
            onClick={logout}
          >
            LOGOUT
          </Button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 ml-[288px]">
        {/* Header */}
        <header
          className="fixed top-0 right-0 left-[288px] h-20 backdrop-blur-md border-b z-10"
          style={{
            backgroundColor: 'var(--ch-header)',
            borderColor: 'var(--ch-border)',
          }}
        >
          <div className="h-full px-10 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px]"
                  style={{ color: 'var(--ch-muted)', opacity: 0.5 }}
                />
                <Input
                  placeholder="Search courses, faculty, or events..."
                  className="pl-11 pr-4 h-11 rounded-full text-sm border"
                  style={{
                    backgroundColor: 'var(--ch-card)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              {/* Workspace badge in header */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--ch-accent-soft)',
                  color: wsAccent,
                  border: '1px solid var(--ch-accent-soft)',
                }}
              >
                {isEducation ? 'Learning Mode' : 'Admin Mode'}
              </div>

              {/* Notifications */}
              <NotificationPanel />

              <div className="w-px h-8" style={{ backgroundColor: 'var(--ch-border)' }} />

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="no-transition w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
                style={{
                  backgroundColor: isDark ? 'var(--ch-nav-active)' : 'var(--ch-card)',
                  borderColor: 'var(--ch-border)',
                  color: wsAccent,
                }}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark
                  ? <Sun className="w-4 h-4" />
                  : <Moon className="w-4 h-4" />
                }
              </button>

              {/* Accent color picker */}
              <AccentPicker />

              {/* Profile */}
              <Link href="/student/profile">
                <Button
                  variant="ghost"
                  className="h-10 px-3 rounded-full gap-2 border"
                  style={{
                    backgroundColor: 'var(--ch-card)',
                    borderColor: 'var(--ch-border)',
                  }}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src="/placeholder-avatar.png" />
                    <AvatarFallback
                      className="text-white text-xs"
                      style={{ backgroundColor: wsAccent }}
                    >
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--ch-text)' }}
                  >
                    {user?.name?.split(' ')[0]?.toUpperCase() || 'STUDENT'}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-28 pb-12 px-10">
          <div className={`no-transition ${contentAnimClass}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
