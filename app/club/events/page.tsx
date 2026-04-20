'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, MapPin, Clock, CalendarDays } from 'lucide-react';

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
      setItems(data.events);
    } catch (e: any) {
      setError(e.message);
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

  return (
    <ClubLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Events</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Event
          </Button>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No events yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((e) => (
              <div
                key={e.id}
                className="rounded-xl p-4 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>{e.name}</h3>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border"
                        style={{ color: 'var(--ch-accent)', borderColor: 'var(--ch-border)' }}
                      >
                        {e.status}
                      </span>
                    </div>
                    {e.description && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>{e.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: 'var(--ch-muted)' }}>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {e.event_date}</span>
                      {e.event_time && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {e.event_time}</span>}
                      {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.venue}</span>}
                      {e.max_participants && <span>Max: {e.max_participants}</span>}
                      {e.eligibility && <span>Eligibility: {e.eligibility}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
