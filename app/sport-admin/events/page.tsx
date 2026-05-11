'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import SportAdminLayout from '@/components/layout/SportAdminLayout';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EVENT_STATUSES, type EventStatus } from '@/lib/sports';

interface AdminEvent {
  id: string;
  sport_id: string;
  sport_name?: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  eligibility: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  status: EventStatus;
  registration_count: number;
  pending_count: number;
  total_registrations: number;
}

type StatusFilter = 'All' | EventStatus;

const STATUS_COLOR: Record<EventStatus, string> = {
  Upcoming: 'bg-sky-100 text-sky-700 border-sky-200',
  Ongoing: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function SportAdminEventsPage() {
  const { loading, authorized } = useRoleProtection('sport_admin');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    if (!authorized) return;
    const run = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Not authenticated');

        const params = new URLSearchParams();
        if (filter !== 'All') params.set('status', filter);
        const url = `/api/faculty/sports/events${params.toString() ? `?${params.toString()}` : ''}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load events');
        setEvents(json.events || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingData(false);
      }
    };
    run();
  }, [authorized, filter]);

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
            <CalendarDays className="w-5 h-5" style={{ color: 'var(--ch-accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              Events
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              All scheduled sport events with student registration counts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['All', ...EVENT_STATUSES] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(s)}
              className="rounded-full"
            >
              {s}
            </Button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl p-4 border border-rose-200 bg-rose-50 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loadingData ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div
            className="rounded-xl p-6 border text-sm"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
          >
            No events found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="rounded-xl p-5 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg" style={{ color: 'var(--ch-text)' }}>
                        {e.name}
                      </h3>
                      {e.sport_name && <Badge variant="outline">{e.sport_name}</Badge>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[e.status]}`}>
                        {e.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm" style={{ color: 'var(--ch-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{e.event_date}</span>
                      </div>
                      {e.event_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{e.event_time.slice(0, 5)}</span>
                        </div>
                      )}
                      {e.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{e.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {e.registration_count} approved
                          {e.pending_count > 0 && ` · ${e.pending_count} pending`}
                          {e.max_participants ? ` / ${e.max_participants} max` : ''}
                        </span>
                      </div>
                    </div>

                    {e.description && (
                      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                        {e.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SportAdminLayout>
  );
}
