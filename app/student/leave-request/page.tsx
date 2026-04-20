'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import StudentLayout from '@/components/layout/StudentLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CalendarDays, Send } from 'lucide-react';

interface LeaveRequest {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_COLOR: Record<LeaveRequest['status'], string> = {
  pending: '#d97706',
  approved: '#059669',
  rejected: '#dc2626',
};

export default function StudentLeaveRequestPage() {
  const { loading, authorized } = useRoleProtection('student');
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [items, setItems] = useState<LeaveRequest[]>([]);

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
      toast({ title: 'Load failed', description: e.message, variant: 'destructive' });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
  }, [authorized]);

  const handleSubmit = async () => {
    if (!reason.trim() || !fromDate || !toDate) {
      toast({ title: 'Missing fields', description: 'Reason, from and to dates are required.', variant: 'destructive' });
      return;
    }
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      toast({ title: 'Invalid dates', description: 'From date cannot be after to date.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ reason: reason.trim(), fromDate, toDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      toast({ title: 'Submitted', description: 'Your leave request has been sent for review.' });
      setReason('');
      setFromDate('');
      setToDate('');
      load();
    } catch (e: any) {
      toast({ title: 'Submit failed', description: e.message, variant: 'destructive' });
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
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Leave Request</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Submit a leave request to your class incharge. You can track approval status here.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            className="rounded-xl p-6 border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ch-text)' }}>Apply for Leave</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>Reason</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  placeholder="Explain why you need leave"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>From date</label>
                  <Input
                    type="date"
                    value={fromDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>To date</label>
                  <Input
                    type="date"
                    value={toDate}
                    min={fromDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>

          <div
            className="rounded-xl p-6 border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ch-text)' }}>My Requests</h2>
            {fetching ? (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No leave requests yet.</p>
            ) : (
              <div className="space-y-3">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--ch-text)' }}>
                        {r.reason}
                      </p>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full capitalize shrink-0"
                        style={{
                          backgroundColor: `${STATUS_COLOR[r.status]}15`,
                          color: STATUS_COLOR[r.status],
                          border: `1px solid ${STATUS_COLOR[r.status]}40`,
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(r.from_date).toLocaleDateString()} → {new Date(r.to_date).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span>{daysBetween(r.from_date, r.to_date)} day(s)</span>
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--ch-muted)' }}>
                      Applied on {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
