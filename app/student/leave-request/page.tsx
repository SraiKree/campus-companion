'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import StudentLayout from '@/components/layout/StudentLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CalendarDays, Plus, X, Send } from 'lucide-react';

interface LeaveRequest {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_COLORS: Record<LeaveRequest['status'], string> = {
  pending: '#f59e0b',
  approved: '#16a34a',
  rejected: '#dc2626',
};

export default function StudentLeaveRequestPage() {
  const { loading, authorized } = useRoleProtection('student');
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ reason: '', fromDate: '', toDate: '' });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/student/leave-requests', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(Array.isArray(data.leaveRequests) ? data.leaveRequests : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.reason.trim() || !form.fromDate || !form.toDate) {
      toast({ title: 'Missing fields', description: 'Reason, from and to dates are required.', variant: 'destructive' });
      return;
    }
    if (new Date(form.fromDate).getTime() > new Date(form.toDate).getTime()) {
      toast({ title: 'Invalid dates', description: 'From date cannot be after to date.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ reason: form.reason.trim(), fromDate: form.fromDate, toDate: form.toDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      toast({ title: 'Submitted', description: 'Your leave request has been sent for review.' });
      setShowForm(false);
      setForm({ reason: '', fromDate: '', toDate: '' });
      await load();
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
    <StudentLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
              <CalendarDays className="w-7 h-7" /> Leave Request
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Submit a leave request to your class incharge. You can track approval status here.
            </p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close' : 'New Request'}
          </Button>
        </div>

        {error && (
          <div
            className="rounded-md border p-3 text-sm"
            style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={submit}
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>Reason *</label>
              <Textarea
                required
                rows={5}
                placeholder="Explain why you need leave"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>From date *</label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>To date *</label>
                <Input
                  type="date"
                  required
                  min={form.fromDate || new Date().toISOString().slice(0, 10)}
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>You haven't submitted any leave requests yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold line-clamp-2" style={{ color: 'var(--ch-text)' }}>{r.reason}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(r.from_date).toLocaleDateString()} → {new Date(r.to_date).toLocaleDateString()}
                      {' · '}
                      {daysBetween(r.from_date, r.to_date)} day(s)
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium uppercase shrink-0"
                    style={{ backgroundColor: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  Applied {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
