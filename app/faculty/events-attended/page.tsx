'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  organizer: string | null;
  location: string | null;
  date_from: string | null;
  date_to: string | null;
  certificate_url: string | null;
  notes: string | null;
}

export default function FacultyEventsAttendedPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    event_name: '', event_type: 'workshop', organizer: '', location: '',
    date_from: '', date_to: '', certificate_url: '', notes: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/faculty/events-attended', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEvents(data.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/faculty/events-attended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setShowAdd(false);
      setForm({ event_name: '', event_type: 'workshop', organizer: '', location: '', date_from: '', date_to: '', certificate_url: '', notes: '' });
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/faculty/events-attended?id=${id}`, { method: 'DELETE', headers: await authHeaders() });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete');
      }
      await load();
    } catch (e: any) { setError(e.message); }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <FacultyLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
              <CalendarDays className="w-7 h-7" /> Events Attended
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Workshops, conferences, FDPs and seminars you've attended. Used for promotions and reviews.
            </p>
          </div>
          <Button onClick={() => setShowAdd(v => !v)} className="gap-2">
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showAdd ? 'Close' : 'Log Event'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {showAdd && (
          <form onSubmit={onAdd} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input required placeholder="Event name *" value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} />
              <select
                className="h-10 px-3 rounded-md border text-sm"
                style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                value={form.event_type}
                onChange={e => setForm({ ...form, event_type: e.target.value })}
              >
                <option value="workshop">Workshop</option>
                <option value="conference">Conference</option>
                <option value="fdp">FDP</option>
                <option value="seminar">Seminar</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </select>
              <Input placeholder="Organizer" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
              <Input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              <Input type="date" placeholder="From" value={form.date_from} onChange={e => setForm({ ...form, date_from: e.target.value })} />
              <Input type="date" placeholder="To" value={form.date_to} onChange={e => setForm({ ...form, date_to: e.target.value })} />
              <Input placeholder="Certificate URL" value={form.certificate_url} onChange={e => setForm({ ...form, certificate_url: e.target.value })} className="md:col-span-2" />
              <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
            </div>
            <Button type="submit">Save</Button>
          </form>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No events logged yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="rounded-xl border p-4 flex justify-between items-start" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                      {e.event_type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      {e.date_from || '—'}{e.date_to && e.date_to !== e.date_from ? ` → ${e.date_to}` : ''}
                    </span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{e.event_name}</p>
                  <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                    {[e.organizer, e.location].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {e.notes && <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>{e.notes}</p>}
                  {e.certificate_url && (
                    <a href={e.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 inline-block" style={{ color: 'var(--ch-accent)' }}>
                      View certificate
                    </a>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
