'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

interface Fine {
  id: string;
  student_roll: string;
  reason: 'overdue' | 'damage' | 'lost';
  amount: number;
  status: 'unpaid' | 'paid' | 'waived';
  payment_ref: string | null;
  paid_on: string | null;
  waiver_reason: string | null;
  created_at: string;
  library_issues: {
    id: string;
    copy_barcode: string;
    books: { title: string } | null;
  } | null;
}

const STATUS_COLORS: Record<Fine['status'], string> = {
  unpaid: '#ca8a04',
  paid: '#16a34a',
  waived: '#6b7280',
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function FinesPage() {
  const { loading, authorized } = useRoleProtection('library');
  const [fines, setFines] = useState<Fine[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('unpaid');

  const [payFine, setPayFine] = useState<Fine | null>(null);
  const [waiveFine, setWaiveFine] = useState<Fine | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await libraryFetch(`/api/library/fines${qs}`);
      setFines(data.fines);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, [statusFilter]);

  useEffect(() => { if (authorized) load(); }, [authorized, load]);

  const totals = fines.reduce(
    (acc, f) => {
      const amt = Number(f.amount);
      if (f.status === 'unpaid') acc.unpaid += amt;
      if (f.status === 'paid') acc.paid += amt;
      if (f.status === 'waived') acc.waived += amt;
      return acc;
    },
    { unpaid: 0, paid: 0, waived: 0 }
  );

  const handleMarkPaid = async () => {
    if (!payFine) return;
    setSubmitting(true); setError(null);
    try {
      await libraryFetch(`/api/library/fines?id=${payFine.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paid', payment_ref: paymentRef.trim() || null }),
      });
      setPayFine(null); setPaymentRef('');
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaive = async () => {
    if (!waiveFine || !waiverReason.trim()) return;
    setSubmitting(true); setError(null);
    try {
      await libraryFetch(`/api/library/fines?id=${waiveFine.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'waived', waiver_reason: waiverReason.trim() }),
      });
      setWaiveFine(null); setWaiverReason('');
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <LibraryLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Fines</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>{fines.length} record{fines.length === 1 ? '' : 's'}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Unpaid', value: totals.unpaid, color: '#ca8a04' },
            { label: 'Paid', value: totals.paid, color: '#16a34a' },
            { label: 'Waived', value: totals.waived, color: '#6b7280' },
          ].map(x => (
            <div key={x.label} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>{x.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: x.color }}>{formatINR(x.value)}</p>
            </div>
          ))}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : fines.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No fines.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Book</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Reason</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {fines.map(f => (
                  <tr key={f.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--ch-text)' }}>{f.student_roll}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{f.library_issues?.books?.title || '—'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{f.reason}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--ch-text)' }}>{formatINR(Number(f.amount))}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                        backgroundColor: `${STATUS_COLORS[f.status]}1A`,
                        color: STATUS_COLORS[f.status],
                      }}>{f.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.status === 'unpaid' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setPayFine(f); setPaymentRef(''); }} title="Mark paid">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setWaiveFine(f); setWaiverReason(''); }} className="text-xs">
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

        <Dialog open={!!payFine} onOpenChange={v => !v && setPayFine(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark Fine Paid</DialogTitle></DialogHeader>
            {payFine && (
              <div className="space-y-3 py-2">
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                  <span className="font-mono">{payFine.student_roll}</span> · {formatINR(Number(payFine.amount))} · {payFine.reason}
                </p>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Receipt / Payment reference</label>
                  <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Receipt #" />
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayFine(null)}>Cancel</Button>
              <Button disabled={submitting} onClick={handleMarkPaid} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                {submitting ? 'Saving…' : 'Mark Paid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!waiveFine} onOpenChange={v => !v && setWaiveFine(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Waive Fine</DialogTitle></DialogHeader>
            {waiveFine && (
              <div className="space-y-3 py-2">
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                  <span className="font-mono">{waiveFine.student_roll}</span> · {formatINR(Number(waiveFine.amount))}
                </p>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Reason (required, will be logged)</label>
                  <Input value={waiverReason} onChange={e => setWaiverReason(e.target.value)} placeholder="Annual amnesty / approved by principal" />
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWaiveFine(null)}>Cancel</Button>
              <Button disabled={submitting || !waiverReason.trim()} onClick={handleWaive} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                {submitting ? 'Saving…' : 'Waive'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LibraryLayout>
  );
}
