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
import { MOCK_ANNOUNCEMENTS } from '@/lib/club-mock-data';
import { Plus, Trash2, Megaphone } from 'lucide-react';

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
      setItems(data.announcements.length > 0 ? data.announcements : MOCK_ANNOUNCEMENTS);
    } catch {
      setItems(MOCK_ANNOUNCEMENTS);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>Announcements</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ch-muted)' }}>
              {items.length} announcement{items.length !== 1 ? 's' : ''} posted
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="font-bold"
            style={{ backgroundColor: 'var(--ch-accent)', color: '#fff' }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> New
          </Button>
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
            {items.map((a, idx) => {
              const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={a.id}
                  className="rounded-xl border"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                >
                  <div className="flex items-start gap-4 px-5 py-5">
                    {/* Icon block */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Megaphone className="w-4 h-4" style={{ color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--ch-text)' }}>
                          {a.title}
                        </h3>
                        <Badge
                          className="text-[9px] font-bold border-0 px-1.5 py-0.5"
                          style={{
                            backgroundColor: a.is_active ? '#22c55e20' : '#71717a20',
                            color: a.is_active ? '#22c55e' : '#71717a',
                          }}
                        >
                          {a.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {a.body && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
                          {a.body}
                        </p>
                      )}
                      <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--ch-muted)' }}>
                        {new Date(a.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 h-8 w-8 p-0"
                      onClick={() => handleDelete(a.id)}
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
