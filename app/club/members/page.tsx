'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MOCK_MEMBERS } from '@/lib/club-mock-data';
import { UserPlus, Trash2, Users } from 'lucide-react';

interface Member {
  id: string;
  roll_number: string;
  student_name: string | null;
  added_at: string;
}

const AVATAR_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

export default function ClubMembersPage() {
  const { loading, authorized } = useRoleProtection('club');
  const [items, setItems] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roll, setRoll] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/club/members', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.members.length > 0 ? data.members : MOCK_MEMBERS);
    } catch {
      setItems(MOCK_MEMBERS);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const handleAdd = async () => {
    if (!roll.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/club/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ roll_number: roll }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setRoll('');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await fetch(`/api/club/members?id=${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');
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
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>Members</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            {items.length} active member{items.length !== 1 ? 's' : ''} in the club
          </p>
        </div>

        {/* Stats card */}
        <div
          className="rounded-xl p-5 border flex items-center gap-4"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#6366f118' }}
          >
            <Users className="w-5 h-5" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <p className="text-3xl font-black" style={{ color: 'var(--ch-text)' }}>{items.length}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--ch-muted)' }}>
              Total Members
            </p>
          </div>
        </div>

        {/* Add member */}
        <div
          className="rounded-xl p-4 border flex items-end gap-3"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
              Add by roll number
            </label>
            <Input
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="e.g. 22R25A0501"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!roll.trim() || submitting}
            style={{ backgroundColor: 'var(--ch-accent)', color: '#fff' }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {submitting ? 'Adding...' : 'Add'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Members list */}
        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            {items.map((m, idx) => {
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const initials = (m.student_name || m.roll_number)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--ch-border)' }}
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback
                      className="text-white text-xs font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                      {m.student_name || '—'}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--ch-muted)' }}>
                      {m.roll_number}
                    </p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--ch-muted)' }}>
                    Joined {new Date(m.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => handleRemove(m.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClubLayout>
  );
}
