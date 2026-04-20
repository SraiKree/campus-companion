'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Eye, CalendarDays } from 'lucide-react';

interface LeaveRequest {
  id: string;
  student_id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student_name: string | null;
  student_roll_no: string | null;
  class_name: string | null;
}

const TABS: Array<LeaveRequest['status']> = ['pending', 'approved', 'rejected'];

export default function FacultyLeaveRequestsPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [tab, setTab] = useState<LeaveRequest['status']>('pending');
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<LeaveRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async (status: LeaveRequest['status']) => {
    try {
      setFetching(true);
      const res = await fetch(`/api/faculty/leave-requests?status=${status}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.leaveRequests || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load(tab);
  }, [authorized, tab]);

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!active) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/faculty/leave-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ leaveRequestId: active.id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setActive(null);
      load(tab);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const daysBetween = (from: string, to: string) => {
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    return Math.round((b - a) / 86400000) + 1;
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <FacultyLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Leave Requests</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Approve or reject leave applications from students in your classes.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-medium border capitalize"
              style={{
                backgroundColor: tab === t ? 'var(--ch-accent)' : 'var(--ch-card)',
                color: tab === t ? '#fff' : 'var(--ch-muted)',
                borderColor: 'var(--ch-border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No {tab} requests.</p>
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
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Class</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Dates</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Days</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Applied</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2 font-mono" style={{ color: 'var(--ch-text)' }}>{r.student_roll_no || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{r.student_name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{r.class_name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {r.from_date} → {r.to_date}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--ch-text)' }}>{daysBetween(r.from_date, r.to_date)}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setActive(r)}>
                        <Eye className="w-4 h-4 mr-1" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {active?.student_roll_no} — {active?.student_name}
            </DialogTitle>
            <DialogDescription>
              {active && `${active.from_date} → ${active.to_date} · ${daysBetween(active.from_date, active.to_date)} day(s)`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Class</p>
              <p style={{ color: 'var(--ch-text)' }}>{active?.class_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Reason</p>
              <p className="whitespace-pre-wrap" style={{ color: 'var(--ch-text)' }}>{active?.reason}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Applied on</p>
              <p style={{ color: 'var(--ch-text)' }}>{active && new Date(active.created_at).toLocaleString()}</p>
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setActive(null)}>Close</Button>
            {active?.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => updateStatus('rejected')}
                  disabled={submitting}
                  style={{ color: '#dc2626' }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  onClick={() => updateStatus('approved')}
                  disabled={submitting}
                  style={{ backgroundColor: '#059669', color: '#fff' }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FacultyLayout>
  );
}
