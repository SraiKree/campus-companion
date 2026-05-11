'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { MOCK_EVENTS } from '@/lib/club-mock-data';
import { Plus, Trash2, MapPin, Clock, CalendarDays, Users } from 'lucide-react';

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  eligibility: string | null;
  max_participants: number | null;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: '#6366f120', color: '#6366f1' },
  Ongoing: { bg: '#22c55e20', color: '#22c55e' },
  Completed: { bg: '#71717a20', color: '#71717a' },
  Cancelled: { bg: '#ef444420', color: '#ef4444' },
};

export default function ClubEventsPage() {
  const { loading, authorized } = useRoleProtection('club');
  const [items, setItems] = useState<EventItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    event_time: '',
    venue: '',
    eligibility: '',
    max_participants: '',
    description: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/club/events', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.events.length > 0 ? data.events : MOCK_EVENTS);
    } catch {
      setItems(MOCK_EVENTS);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.event_date) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/club/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          name: form.name,
          event_date: form.event_date,
          event_time: form.event_time || null,
          venue: form.venue || null,
          eligibility: form.eligibility || null,
          max_participants: form.max_participants ? Number(form.max_participants) : null,
          description: form.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setDialogOpen(false);
      setForm({ name: '', event_date: '', event_time: '', venue: '', eligibility: '', max_participants: '', description: '' });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/club/events?id=${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const upcomingCount = items.filter((e) => e.status === 'Upcoming').length;
  const ongoingCount = items.filter((e) => e.status === 'Ongoing').length;
  const completedCount = items.filter((e) => e.status === 'Completed').length;

  return (
    <ClubLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>Events</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ch-muted)' }}>
              Manage and schedule club events
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="font-bold"
            style={{ backgroundColor: 'var(--ch-accent)', color: '#fff' }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Event
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Upcoming', count: upcomingCount, color: '#6366f1' },
            { label: 'Ongoing', count: ongoingCount, color: '#22c55e' },
            { label: 'Completed', count: completedCount, color: '#71717a' },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 border"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <p className="text-2xl font-black" style={{ color }}>{count}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : (
          <div className="space-y-3">
            {items.map((e) => {
              const style = STATUS_STYLES[e.status] || STATUS_STYLES.Upcoming;
              return (
                <div
                  key={e.id}
                  className="rounded-xl border"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                >
                  <div className="flex items-start gap-4 px-5 py-5">
                    {/* Date block */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center border"
                      style={{ backgroundColor: `${style.color}12`, borderColor: `${style.color}30` }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: style.color }}>
                        {new Date(e.event_date).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black leading-none" style={{ color: style.color }}>
                        {new Date(e.event_date).getDate()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--ch-text)' }}>{e.name}</h3>
                        <Badge
                          className="text-[10px] font-bold border-0 px-2 py-0.5"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {e.status}
                        </Badge>
                      </div>
                      {e.description && (
                        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--ch-muted)' }}>
                          {e.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--ch-muted)' }}>
                        {e.event_time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {e.event_time}
                          </span>
                        )}
                        {e.venue && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {e.venue}
                          </span>
                        )}
                        {e.max_participants && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" /> Max {e.max_participants}
                          </span>
                        )}
                        {e.eligibility && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> {e.eligibility}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 h-8 w-8 p-0"
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
            <DialogDescription>Schedule a club event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Date</label>
                <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Time</label>
                <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Venue</label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Eligibility</label>
                <Input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="All students" />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Max participants</label>
                <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || !form.event_date || submitting}>
              {submitting ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
