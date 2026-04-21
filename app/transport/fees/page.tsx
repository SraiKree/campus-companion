'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import TransportLayout from '@/components/layout/TransportLayout';
import { transportFetch } from '@/lib/transport-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Bell } from 'lucide-react';

interface Fee {
  id: string;
  student_roll: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_ref: string | null;
  status: 'pending' | 'paid' | 'partial' | 'waived' | 'overdue';
  transport_routes: { id: string; name: string } | null;
}

const STATUS_COLORS: Record<Fee['status'], string> = {
  paid: '#16a34a',
  pending: '#ca8a04',
  partial: '#ca8a04',
  overdue: '#dc2626',
  waived: '#6b7280',
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function FeesPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [fees, setFees] = useState<Fee[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [markFee, setMarkFee] = useState<Fee | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await transportFetch(`/api/transport/fees${qs}`);
      setFees(data.fees);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, [statusFilter]);

  useEffect(() => { if (authorized) load(); }, [authorized, load]);

  const totals = fees.reduce(
    (acc, f) => {
      const amt = Number(f.amount);
      acc.total += amt;
      if (f.status === 'paid') acc.collected += amt;
      if (f.status === 'pending' || f.status === 'partial') acc.pending += amt;
      if (f.status === 'overdue') acc.overdue += amt;
      return acc;
    },
    { total: 0, collected: 0, pending: 0, overdue: 0 }
  );

  const handleMarkPaid = async () => {
    if (!markFee) return;
    setSubmitting(true);
    setError(null);
    try {
      await transportFetch(`/api/transport/fees?id=${markFee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paid', payment_ref: paymentRef.trim() || null }),
      });
      setMarkFee(null);
      setPaymentRef('');
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaive = async (fee: Fee) => {
    if (!confirm(`Waive fee for ${fee.student_roll}?`)) return;
    try {
      await transportFetch(`/api/transport/fees?id=${fee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'waived' }),
      });
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleRemind = async (fee: Fee) => {
    try {
      await transportFetch('/api/transport/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'fee_reminder',
          audience_type: 'student',
          audience_ref: fee.student_roll,
          message: `Fee reminder: ${formatINR(Number(fee.amount))} is due for route ${fee.transport_routes?.name || ''}. Please pay at the earliest.`,
        }),
      });
      alert('Reminder sent');
    } catch (e: unknown) {
      setError((e as Error).message);
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Fees</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            {fees.length} fee record{fees.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totals.total, color: 'var(--ch-text)' },
            { label: 'Collected', value: totals.collected, color: '#16a34a' },
            { label: 'Pending', value: totals.pending, color: '#ca8a04' },
            { label: 'Overdue', value: totals.overdue, color: '#dc2626' },
          ].map(x => (
            <div key={x.label} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>{x.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: x.color }}>{formatINR(x.value)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : fees.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No fees found.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Route</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Due</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--ch-text)' }}>{f.student_roll}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{f.transport_routes?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--ch-text)' }}>{formatINR(Number(f.amount))}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{new Date(f.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                        backgroundColor: `${STATUS_COLORS[f.status]}1A`,
                        color: STATUS_COLORS[f.status],
                      }}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.status !== 'paid' && f.status !== 'waived' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setMarkFee(f); setPaymentRef(''); }} title="Mark paid">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemind(f)} title="Send reminder">
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleWaive(f)} title="Waive" className="text-xs">
                            waive
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!markFee} onOpenChange={v => !v && setMarkFee(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark Fee Paid</DialogTitle></DialogHeader>
            {markFee && (
              <div className="space-y-3 py-2">
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                  <span className="font-mono">{markFee.student_roll}</span> · {formatINR(Number(markFee.amount))} · {markFee.transport_routes?.name}
                </p>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Payment reference (optional)</label>
                  <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Receipt # or txn ID" />
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMarkFee(null)}>Cancel</Button>
              <Button disabled={submitting} onClick={handleMarkPaid} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                {submitting ? 'Saving…' : 'Mark Paid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TransportLayout>
  );
}
