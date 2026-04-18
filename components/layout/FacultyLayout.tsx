'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search, Home, Calendar, Clock, CalendarDays,
  BookOpen, FileText, Megaphone, Sun, Moon, UserCircle, MessageSquare, Trophy, Library,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationPanel from '@/components/NotificationPanel';

interface FacultyLayoutProps {
  children: ReactNode;
}

const FacultyLayout = ({ children }: FacultyLayoutProps) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navItems = [
    { href: '/faculty', label: 'Dashboard', icon: Home },
    { href: '/faculty/attendance', label: 'Attendance', icon: Calendar },
    { href: '/faculty/timetable', label: 'Timetable', icon: Clock },
    { href: '/faculty/academic-planning', label: 'Academic Planning', icon: CalendarDays },
    { href: '/faculty/grades', label: 'Grades', icon: BookOpen },
    { href: '/faculty/assignments', label: 'Assignments', icon: FileText },
    { href: '/faculty/learning-resources', label: 'Learning Resources', icon: Library },
    { href: '/faculty/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/faculty/sports', label: 'Sports & Activities', icon: Trophy },
    { href: '/faculty/complaints', label: 'Complaints', icon: MessageSquare },
    { href: '/faculty/profile', label: 'Profile', icon: UserCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/faculty') return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <div
      className={`ch-themed min-h-screen flex${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-[288px] flex flex-col p-6 z-20 border-r"
        style={{
          backgroundColor: 'var(--ch-sidebar)',
          borderColor: 'var(--ch-border)',
        }}
      >
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--ch-accent)' }}
            >
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: 'var(--ch-accent)' }}
              >
                Campus Hub
              </h1>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--ch-muted)' }}
              >
                Faculty Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--ch-nav-active)' : 'transparent',
                    border: active ? '1px solid var(--ch-border)' : '1px solid transparent',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--ch-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
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
                </div>
              </Link>
            );
          })}
        </nav>

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
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: 'var(--ch-accent)' }}
              >
                {user?.name?.charAt(0) || 'F'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p
                className="text-sm font-bold truncate"
                style={{ color: 'var(--ch-text)' }}
              >
                {user?.name || 'Faculty'}
              </p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                {user?.email || 'faculty@campus.edu'}
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

      {/* Main Content */}
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
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px]"
                  style={{ color: 'var(--ch-muted)', opacity: 0.5 }}
                />
                <Input
                  placeholder="Search students, classes, or subjects..."
                  className="pl-11 pr-4 h-11 rounded-full text-sm border"
                  style={{
                    backgroundColor: 'var(--ch-card)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationPanel />
              <div className="w-px h-8" style={{ backgroundColor: 'var(--ch-border)' }} />

              {/* Dark mode toggle */}
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
                    style={{ backgroundColor: 'var(--ch-accent)' }}
                  >
                    {user?.name?.charAt(0) || 'F'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold" style={{ color: 'var(--ch-text)' }}>
                  {user?.name?.split(' ')[0]?.toUpperCase() || 'FACULTY'}
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-28 pb-12 px-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;
