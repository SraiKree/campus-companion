'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import TransportLayout from '@/components/layout/TransportLayout';
import { transportFetch } from '@/lib/transport-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Send, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'bus_delay' | 'route_change' | 'fee_reminder' | 'general';
  audience_type: string;
  audience_ref: string | null;
  message: string;
  recipient_count: number;
  sent_at: string;
}
interface Bus { id: string; bus_number: string }
interface Route {
  id: string;
  name: string;
  transport_route_stops: Array<{ id: string; stop_name: string }>;
}

const TYPES = [
  { value: 'bus_delay', label: 'Bus Delay' },
  { value: 'route_change', label: 'Route Change' },
  { value: 'fee_reminder', label: 'Fee Reminder' },
  { value: 'general', label: 'General' },
];
const AUDIENCES = [
  { value: 'bus', label: 'Specific bus' },
  { value: 'route', label: 'Specific route' },
  { value: 'stop', label: 'Specific stop' },
  { value: 'student', label: 'Individual student' },
  { value: 'overdue_all', label: 'All overdue fee payers' },
];

export default function NotificationsPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [history, setHistory] = useState<Notification[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [type, setType] = useState('bus_delay');
  const [audienceType, setAudienceType] = useState('bus');
  const [audienceRef, setAudienceRef] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const [n, b, r] = await Promise.all([
        transportFetch('/api/transport/notifications'),
        transportFetch('/api/transport/buses'),
        transportFetch('/api/transport/routes'),
      ]);
      setHistory(n.notifications);
      setBuses(b.buses);
      setRoutes(r.routes);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { if (authorized) load(); }, [authorized, load]);

  const selectedRouteForStops = routes.find(r =>
    r.transport_route_stops.some(s => s.id === audienceRef)
  ) || routes[0];

  const audienceOptions = () => {
    if (audienceType === 'bus') {
      return buses.map(b => ({ value: b.id, label: b.bus_number }));
    }
    if (audienceType === 'route') {
      return routes.map(r => ({ value: r.id, label: r.name }));
    }
    if (audienceType === 'stop') {
      return routes.flatMap(r =>
        r.transport_route_stops.map(s => ({ value: s.id, label: `${r.name} — ${s.stop_name}` }))
      );
    }
    return [];
  };

  const needsRef = audienceType !== 'overdue_all' && audienceType !== 'student';

  const handleSend = async () => {
    setSubmitting(true);
    setError(null); setSuccess(null);
    try {
      let ref: string | null = null;
      if (audienceType === 'overdue_all') ref = null;
      else if (audienceType === 'student') ref = audienceRef.trim().toUpperCase();
      else ref = audienceRef;

      const data = await transportFetch('/api/transport/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type, audience_type: audienceType, audience_ref: ref, message: message.trim(),
        }),
      });
      setSuccess(`Sent to ${data.notification.recipient_count} recipient${data.notification.recipient_count === 1 ? '' : 's'}.`);
      setMessage(''); setAudienceRef('');
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
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
    <TransportLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Compose and send alerts to riders.
          </p>
        </div>

        <div className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>New Alert</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Audience</label>
              <Select value={audienceType} onValueChange={v => { setAudienceType(v); setAudienceRef(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsRef && (
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>
                {audienceType === 'bus' ? 'Pick bus' : audienceType === 'route' ? 'Pick route' : 'Pick stop'}
              </label>
              <Select value={audienceRef} onValueChange={setAudienceRef}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {audienceOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {audienceType === 'student' && (
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Student roll number</label>
              <Input value={audienceRef} onChange={e => setAudienceRef(e.target.value)} placeholder="23R21A1285" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-md border p-2 text-sm"
              style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              placeholder="Bus will be 20 minutes late due to traffic…"
            />
          </div>

          {error && <p className="text-sm flex items-center gap-1" style={{ color: '#dc2626' }}><AlertCircle className="w-3 h-3" /> {error}</p>}
          {success && <p className="text-sm" style={{ color: '#16a34a' }}>{success}</p>}

          <div className="flex justify-end">
            <Button
              disabled={submitting || !message.trim() || (needsRef && !audienceRef) || (audienceType === 'student' && !audienceRef.trim())}
              onClick={handleSend}
              style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>History</h2>
          {fetching ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No alerts sent yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map(n => (
                <div key={n.id} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full" style={{
                        backgroundColor: 'rgba(224,82,82,0.1)', color: 'var(--ch-accent)',
                      }}>
                        {TYPES.find(t => t.value === n.type)?.label || n.type}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        → {n.audience_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(n.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--ch-text)' }}>{n.message}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--ch-muted)' }}>
                    {n.recipient_count} recipient{n.recipient_count === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TransportLayout>
  );
}
