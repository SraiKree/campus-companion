'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search, Home, Users, GraduationCap, BarChart3, Sun, Moon, Shield,
  Inbox, BookOpen, DollarSign, PartyPopper, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationPanel from '@/components/NotificationPanel';
import AccentPicker from '@/components/AccentPicker';

interface PrincipalLayoutProps {
  children: ReactNode;
}

const PrincipalLayout = ({ children }: PrincipalLayoutProps) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navItems = [
    { href: '/principal', label: 'Overview', icon: Home },
    { href: '/principal/approvals', label: 'Approvals Inbox', icon: Inbox },
    { href: '/principal/academic', label: 'Academic', icon: BookOpen },
    { href: '/principal/student-requests', label: 'Student Requests', icon: GraduationCap },
    { href: '/principal/finance', label: 'Finance', icon: DollarSign },
    { href: '/principal/events', label: 'Events', icon: PartyPopper },
    { href: '/principal/escalated', label: 'Escalated', icon: AlertTriangle },
    { href: '/principal/students', label: 'Students', icon: Users },
    { href: '/principal/faculty', label: 'Faculty', icon: Users },
    { href: '/principal/reports', label: 'Reports', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/principal') return pathname === href;
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
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--ch-accent)' }}
            >
              <Shield className="w-5 h-5 text-white" />
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
                Principal Portal
              </p>
            </div>
          </div>
        </div>

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
                {user?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--ch-text)' }}>
                {user?.name || 'Principal'}
              </p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                {user?.email || 'principal@campus.edu'}
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

      <div className="flex-1 ml-[288px]">
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
                  placeholder="Search..."
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
              <button
                onClick={toggleTheme}
                className="no-transition w-10 h-10 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: isDark ? 'var(--ch-nav-active)' : 'var(--ch-card)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-accent)',
                }}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <AccentPicker />
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
                    {user?.name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold" style={{ color: 'var(--ch-text)' }}>
                  {user?.name?.split(' ')[0]?.toUpperCase() || 'PRINCIPAL'}
                </span>
              </Button>
            </div>
          </div>
        </header>

        <main className="pt-28 pb-12 px-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PrincipalLayout;
