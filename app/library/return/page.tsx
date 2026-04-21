'use client';

import { useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Barcode, BookOpen, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface CopyLookup {
  copy: {
    barcode: string;
    status: 'available' | 'issued';
    books: { title: string; author: string };
    shelf_location: string | null;
  };
  active_issue: null | {
    id: string;
    student_roll: string;
    student_name: string | null;
    issued_on: string;
    due_date: string;
    status: 'active' | 'overdue';
  };
}

export default function ReturnPage() {
  const { loading, authorized } = useRoleProtection('library');
  const [barcode, setBarcode] = useState('');
  const [info, setInfo] = useState<CopyLookup | null>(null);
  const [condition, setCondition] = useState<'good' | 'damaged' | 'lost'>('good');
  const [damageAmount, setDamageAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lookup = async () => {
    if (!barcode.trim()) return;
    setError(null); setSuccess(null); setLookingUp(true);
    try {
      const data = await libraryFetch(`/api/library/copies/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
      setInfo(data);
    } catch (e: unknown) {
      setError((e as Error).message);
      setInfo(null);
    } finally {
      setLookingUp(false);
    }
  };

  const handleReturn = async () => {
    if (!info?.active_issue) return;
    setSubmitting(true);
    setError(null); setSuccess(null);
    try {
      const data = await libraryFetch('/api/library/return', {
        method: 'POST',
        body: JSON.stringify({
          copy_barcode: info.copy.barcode,
          condition,
          damage_amount: condition === 'damaged' ? Number(damageAmount || 0) : 0,
        }),
      });
      const fineTotal = (data.fines_created || []).reduce((s: number, f: { amount: number }) => s + Number(f.amount), 0);
      setSuccess(
        data.days_late > 0
          ? `Returned ${data.days_late} day${data.days_late === 1 ? '' : 's'} late. Fine ₹${fineTotal} created.`
          : fineTotal > 0
            ? `Returned. Fine ₹${fineTotal} created.`
            : 'Returned on time. No fine.'
      );
      setBarcode(''); setInfo(null); setCondition('good'); setDamageAmount('');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const daysLate = info?.active_issue
    ? Math.max(0, Math.floor((Date.now() - new Date(info.active_issue.due_date).getTime()) / 86400000))
    : 0;

  return (
    <LibraryLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Return Book</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Scan the copy. System finds the active issue and calculates any fine.
          </p>
        </div>

        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Barcode className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Scan copy</h2>
          </div>
          <div className="flex gap-2">
            <Input
              autoFocus
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') lookup(); }}
              placeholder="Scan copy barcode"
              className="font-mono"
            />
            <Button onClick={lookup} disabled={lookingUp || !barcode.trim()}>
              {lookingUp ? 'Looking…' : 'Lookup'}
            </Button>
          </div>
        </div>

        {info && !info.active_issue && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4" />
            This copy is not currently issued — nothing to return. (Status: {info.copy.status})
          </div>
        )}

        {info?.active_issue && (
          <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5" style={{ color: 'var(--ch-muted)' }} />
              <div>
                <div className="font-semibold" style={{ color: 'var(--ch-text)' }}>{info.copy.books.title}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>{info.copy.books.author}</div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--ch-muted)' }}>{info.copy.barcode}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--ch-border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Borrower</p>
                <p className="font-mono" style={{ color: 'var(--ch-text)' }}>{info.active_issue.student_roll}</p>
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{info.active_issue.student_name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Issued / Due</p>
                <p style={{ color: 'var(--ch-text)' }}>
                  {new Date(info.active_issue.issued_on).toLocaleDateString()} → {new Date(info.active_issue.due_date).toLocaleDateString()}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: daysLate > 0 ? '#dc2626' : '#16a34a' }}>
                  <Clock className="w-3 h-3" />
                  {daysLate > 0 ? `${daysLate} day${daysLate === 1 ? '' : 's'} late` : 'On time'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Return condition</label>
              <Select value={condition} onValueChange={v => setCondition(v as 'good' | 'damaged' | 'lost')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="lost">Lost (not returned)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {condition === 'damaged' && (
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Damage fine (₹)</label>
                <Input type="number" value={damageAmount} onChange={e => setDamageAmount(e.target.value)} placeholder="e.g. 200" />
              </div>
            )}

            <Button
              disabled={submitting}
              onClick={handleReturn}
              className="w-full h-11"
              style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
            >
              {submitting ? 'Processing…' : condition === 'lost' ? 'Mark as Lost' : 'Confirm Return'}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a' }}>
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
      </div>
    </LibraryLayout>
  );
}
