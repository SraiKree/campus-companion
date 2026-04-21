'use client';

import { useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface Issue {
  id: string;
  copy_barcode: string;
  status: 'active' | 'overdue' | 'returned' | 'lost';
  issued_on: string;
  due_date: string;
  returned_on: string | null;
  return_condition: string | null;
  books: { title: string; author: string } | null;
}
interface Fine {
  id: string;
  reason: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'waived';
  created_at: string;
  paid_on: string | null;
}
interface StudentRecord {
  student: { roll_number: string; name: string; department: string | null };
  active: Issue[];
  history: Issue[];
  fines: Fine[];
  unpaid_total: number;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function StudentsPage() {
  const { loading, authorized } = useRoleProtection('library');
  const [roll, setRoll] = useState('');
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const lookup = async () => {
    if (!roll.trim()) return;
    setError(null); setFetching(true);
    try {
      const data = await libraryFetch(`/api/library/students/history?roll=${encodeURIComponent(roll.trim())}`);
      setRecord(data);
    } catch (e: unknown) {
      setError((e as Error).message);
      setRecord(null);
    } finally {
      setFetching(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <LibraryLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Student Record</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Look up a student&apos;s full library history.
          </p>
        </div>

        <div className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input
              autoFocus
              value={roll}
              onChange={e => setRoll(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') lookup(); }}
              placeholder="Scan or type roll number"
              className="pl-10 font-mono"
            />
          </div>
          <Button onClick={lookup} disabled={fetching || !roll.trim()}>
            {fetching ? 'Looking…' : 'Lookup'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {record && (
          <div className="space-y-6">
            <div className="rounded-xl border p-5 flex items-start justify-between" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <div>
                <div className="font-mono text-lg font-bold" style={{ color: 'var(--ch-text)' }}>{record.student.roll_number}</div>
                <div className="text-sm" style={{ color: 'var(--ch-muted)' }}>{record.student.name} · {record.student.department}</div>
              </div>
              <div className="text-right text-sm">
                <div style={{ color: 'var(--ch-muted)' }}>Unpaid fines</div>
                <div className="text-lg font-bold" style={{ color: record.unpaid_total > 0 ? '#dc2626' : 'var(--ch-text)' }}>
                  {formatINR(record.unpaid_total)}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>
                Currently Issued ({record.active.length})
              </h2>
              {record.active.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No active issues.</p>
              ) : (
                <div className="space-y-2">
                  {record.active.map(i => {
                    const daysLate = Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000);
                    const overdue = daysLate > 0;
                    return (
                      <div key={i.id} className="rounded-lg border p-3 flex items-center justify-between" style={{
                        backgroundColor: 'var(--ch-card)',
                        borderColor: overdue ? 'rgba(220,38,38,0.3)' : 'var(--ch-border)',
                      }}>
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 mt-0.5" style={{ color: 'var(--ch-muted)' }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{i.books?.title}</div>
                            <div className="text-xs font-mono" style={{ color: 'var(--ch-muted)' }}>{i.copy_barcode}</div>
                          </div>
                        </div>
                        <div className="text-xs text-right">
                          <div style={{ color: 'var(--ch-muted)' }}>Due {new Date(i.due_date).toLocaleDateString()}</div>
                          <div className="flex items-center gap-1 justify-end mt-0.5" style={{ color: overdue ? '#dc2626' : '#16a34a' }}>
                            <Clock className="w-3 h-3" />
                            {overdue ? `${daysLate} day${daysLate === 1 ? '' : 's'} late` : daysLate === 0 ? 'Due today' : `${-daysLate} day${-daysLate === 1 ? '' : 's'} left`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>
                History ({record.history.length})
              </h2>
              {record.history.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No past issues.</p>
              ) : (
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Book</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Issued</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Returned</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.history.map(i => (
                        <tr key={i.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                          <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{i.books?.title}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--ch-muted)' }}>{new Date(i.issued_on).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                            {i.returned_on ? new Date(i.returned_on).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-2 text-xs">{i.status}{i.return_condition ? ` · ${i.return_condition}` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>
                Fines ({record.fines.length})
              </h2>
              {record.fines.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No fines.</p>
              ) : (
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Reason</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Amount</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                        <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.fines.map(f => (
                        <tr key={f.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                          <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{f.reason}</td>
                          <td className="px-4 py-2 font-semibold" style={{ color: 'var(--ch-text)' }}>{formatINR(Number(f.amount))}</td>
                          <td className="px-4 py-2 text-xs">{f.status}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                            {new Date(f.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LibraryLayout>
  );
}
