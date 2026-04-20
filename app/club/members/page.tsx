'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  roll_number: string;
  student_name: string | null;
  added_at: string;
}

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
      setItems(data.members);
    } catch (e: any) {
      setError(e.message);
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Members</h1>

        <div
          className="rounded-xl p-4 border flex items-end gap-3"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Add by roll number</label>
            <Input
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="e.g. 22R25A0501"
            />
          </div>
          <Button onClick={handleAdd} disabled={!roll.trim() || submitting}>
            <UserPlus className="w-4 h-4 mr-2" /> {submitting ? 'Adding...' : 'Add'}
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
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No members yet.</p>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Added</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2 font-mono" style={{ color: 'var(--ch-text)' }}>{m.roll_number}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{m.student_name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(m.added_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClubLayout>
  );
}
