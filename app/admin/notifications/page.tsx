'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Globe } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_role: string;
  user_id: string | null;
  created_at: string;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export default function AdminNotificationsPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const [items, setItems] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('medium');
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/admin/notifications', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.notifications);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          title,
          message,
          priority,
          roll_number: rollNumber.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setTitle('');
      setMessage('');
      setRollNumber('');
      setPriority('medium');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Notifications</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Send to a specific student (by roll) or broadcast to all students. Status-change notifications for certificates are automatic.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl p-6 border space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ch-text)' }}>Compose</h2>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Recipient (optional)</label>
              <Input
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Roll number — leave blank to broadcast to all students"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Message</label>
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Priority</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="px-3 py-1 rounded-full text-xs font-medium border capitalize"
                    style={{
                      backgroundColor: priority === p ? 'var(--ch-accent)' : 'var(--ch-card)',
                      color: priority === p ? '#fff' : 'var(--ch-muted)',
                      borderColor: 'var(--ch-border)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <Button onClick={send} disabled={submitting || !title.trim() || !message.trim()} className="w-full">
              {rollNumber ? <><Send className="w-4 h-4 mr-2" /> Send to {rollNumber.toUpperCase()}</> : <><Globe className="w-4 h-4 mr-2" /> Broadcast to all students</>}
            </Button>
          </div>

          <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--ch-text)' }}>Recent</h2>
            {fetching ? (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No notifications yet.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg p-3 border"
                    style={{ borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--ch-text)' }}>{n.title}</p>
                      <span className="text-[10px] font-bold uppercase capitalize shrink-0" style={{ color: 'var(--ch-accent)' }}>
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--ch-muted)' }}>{n.message}</p>
                    <p className="text-[11px]" style={{ color: 'var(--ch-muted)' }}>
                      {n.user_id ? 'Direct' : 'Broadcast'} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
