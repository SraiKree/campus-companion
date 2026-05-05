'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import SportAdminLayout from '@/components/layout/SportAdminLayout';
import { CalendarDays, Users, Trophy } from 'lucide-react';

export default function SportAdminDashboardPage() {
  const { user, loading, authorized } = useRoleProtection('sport_admin');

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const stats = [
    { label: 'Upcoming Events', value: '—', Icon: CalendarDays },
    { label: 'Registered Teams', value: '—', Icon: Users },
    { label: 'Court Bookings', value: '—', Icon: Trophy },
  ];

  return (
    <SportAdminLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            {user?.name ?? 'Sport Admin'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Manage events, teams, and court bookings for campus sports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-xl p-5 border"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--ch-nav-active)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  {label}
                </p>
              </div>
              <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SportAdminLayout>
  );
}
