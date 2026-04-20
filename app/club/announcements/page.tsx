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
import { Plus, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ClubAnnouncementsPage() {
  const { loading, authorized } = useRoleProtection('club');
  const [items, setItems] = useState<Announcement[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/club/announcements', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.announcements);
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
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/club/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setDialogOpen(false);
      setTitle('');
      setBody('');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/club/announcements?id=${id}`, {
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Announcements</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New
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
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div
                key={a.id}
                className="rounded-xl p-4 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>{a.title}</h3>
                    {a.body && (
                      <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: 'var(--ch-muted)' }}>
                        {a.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
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
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Post an update to your club.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting on Friday" />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Body</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || submitting}>
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
