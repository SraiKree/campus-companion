'use client';

import { useEffect, useState } from 'react';
import { Users, Crown, User as UserIcon } from 'lucide-react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import SportAdminLayout from '@/components/layout/SportAdminLayout';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import type { SportTeam } from '@/lib/sports';

export default function SportAdminTeamsPage() {
  const { loading, authorized } = useRoleProtection('sport_admin');
  const [teams, setTeams] = useState<SportTeam[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    const run = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Not authenticated');

        const res = await fetch('/api/faculty/sports/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load teams');
        setTeams(json.teams || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingData(false);
      }
    };
    run();
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SportAdminLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--ch-nav-active)' }}
          >
            <Users className="w-5 h-5" style={{ color: 'var(--ch-accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              Teams
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              All sport teams formed by students, with their captains and rosters.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-4 border border-rose-200 bg-rose-50 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loadingData ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading teams...</p>
        ) : teams.length === 0 ? (
          <div
            className="rounded-xl p-6 border text-sm"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
          >
            No teams have been created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="rounded-xl p-5 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--ch-text)' }}>
                      {t.name}
                    </h3>
                    {t.sport_name && (
                      <Badge variant="outline" className="mt-1">{t.sport_name}</Badge>
                    )}
                  </div>
                  {t.captain_name && (
                    <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Crown className="w-3 h-3" />
                      {t.captain_name}
                    </div>
                  )}
                </div>

                {t.description && (
                  <p className="text-sm mb-3" style={{ color: 'var(--ch-muted)' }}>
                    {t.description}
                  </p>
                )}

                <div className="border-t pt-3" style={{ borderColor: 'var(--ch-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-muted)' }}>
                    Members ({t.members?.length ?? 0})
                  </p>
                  {!t.members || t.members.length === 0 ? (
                    <p className="text-sm italic" style={{ color: 'var(--ch-muted)' }}>
                      No members yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {t.members.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-text)' }}>
                          <UserIcon className="w-3.5 h-3.5" style={{ color: 'var(--ch-muted)' }} />
                          <span className="font-medium">{m.student_name || '—'}</span>
                          {m.student_roll_number && (
                            <span style={{ color: 'var(--ch-muted)' }}>· {m.student_roll_number}</span>
                          )}
                          {m.position && (
                            <Badge variant="secondary" className="ml-auto">{m.position}</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SportAdminLayout>
  );
}
