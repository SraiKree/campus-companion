'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import { supabase } from '@/lib/supabase';
import { Users, CalendarDays, Megaphone } from 'lucide-react';

interface ClubInfo {
  id: string;
  name: string;
  description: string | null;
  advisor_name: string | null;
  contact_email: string | null;
}

interface Counts {
  members: number;
  events: number;
  announcements: number;
}

export default function ClubDashboardPage() {
  const { loading, authorized } = useRoleProtection('club');
  const [club, setClub] = useState<ClubInfo | null>(null);
  const [counts, setCounts] = useState<Counts>({ members: 0, events: 0, announcements: 0 });
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/club/me', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load');
        setClub(body.club);
        setCounts(body.counts);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <ClubLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            {club?.name ?? 'Club'}
          </h1>
          {club?.description && (
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              {club.description}
            </p>
          )}
          {club?.advisor_name && (
            <p className="mt-2 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Advisor: <span style={{ color: 'var(--ch-text)' }}>{club.advisor_name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Members', value: counts.members, Icon: Users },
            { label: 'Events', value: counts.events, Icon: CalendarDays },
            { label: 'Active Announcements', value: counts.announcements, Icon: Megaphone },
          ].map(({ label, value, Icon }) => (
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
                {fetching ? '—' : value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ClubLayout>
  );
}
