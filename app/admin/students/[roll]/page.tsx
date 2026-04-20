'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface Profile {
  id?: string | null;
  roll_number: string;
  name: string | null;
  email: string | null;
  department: string | null;
  section: string | null;
  semester: number | null;
  year: number | null;
  [k: string]: any;
}

interface Certificate {
  id: string;
  certificate_type: string;
  purpose: string;
  status: string;
  created_at: string;
  updated_at: string;
  signed_pdf_url: string | null;
}

interface Leave {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  transaction_id: string;
  payment_date: string;
  status: string;
  remarks: string | null;
  created_at: string;
}

const TABS = ['Overview', 'Certificates', 'Leave', 'Fees'] as const;
type Tab = (typeof TABS)[number];

export default function AdminStudentDetailPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const params = useParams();
  const rollParam = Array.isArray(params?.roll) ? params.roll[0] : (params?.roll as string | undefined);
  const [tab, setTab] = useState<Tab>('Overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [fees, setFees] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authorized || !rollParam) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/admin/students/${rollParam}`, {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setProfile(data.student);
        setCerts(data.certificates);
        setLeaves(data.leave_requests);
        setFees(data.fee_payments);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized, rollParam]);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to students
        </Link>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : !profile ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Student not found.</p>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{profile.name}</h1>
              <p className="mt-1 text-sm font-mono" style={{ color: 'var(--ch-muted)' }}>{profile.roll_number}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                {profile.department && <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--ch-border)' }}>{profile.department}</span>}
                {profile.section && <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--ch-border)' }}>Section {profile.section}</span>}
                {profile.year != null && <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--ch-border)' }}>Year {profile.year}</span>}
                {profile.semester != null && <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--ch-border)' }}>Sem {profile.semester}</span>}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-full text-sm font-medium border"
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

            {tab === 'Overview' && (
              <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(profile).filter(([k, v]) => v != null && k !== 'id').map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>{k.replace(/_/g, ' ')}</dt>
                      <dd className="mt-0.5" style={{ color: 'var(--ch-text)' }}>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {tab === 'Certificates' && (
              certs.length === 0
                ? <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No certificate requests.</p>
                : <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Type</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Purpose</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Requested</th>
                          <th className="text-right px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {certs.map((c) => (
                          <tr key={c.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                            <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{c.certificate_type}</td>
                            <td className="px-4 py-2 truncate max-w-[240px]" style={{ color: 'var(--ch-muted)' }}>{c.purpose}</td>
                            <td className="px-4 py-2" style={{ color: 'var(--ch-accent)' }}>{c.status}</td>
                            <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-right">
                              {c.signed_pdf_url && (
                                <a href={c.signed_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--ch-accent)' }}>
                                  PDF <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            )}

            {tab === 'Leave' && (
              leaves.length === 0
                ? <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No leave requests.</p>
                : <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Dates</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Reason</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                          <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((l) => (
                          <tr key={l.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                            <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{l.from_date} → {l.to_date}</td>
                            <td className="px-4 py-2 truncate max-w-[300px]" style={{ color: 'var(--ch-muted)' }}>{l.reason}</td>
                            <td className="px-4 py-2 capitalize" style={{ color: 'var(--ch-accent)' }}>{l.status}</td>
                            <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            )}

            {tab === 'Fees' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  Read-only. Fee verification is handled by the accounts role separately.
                </p>
                {fees.length === 0
                  ? <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No fee payments on record.</p>
                  : <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                            <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Amount</th>
                            <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Txn ID</th>
                            <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Date</th>
                            <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fees.map((f) => (
                            <tr key={f.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                              <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--ch-text)' }}>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 font-mono text-xs" style={{ color: 'var(--ch-muted)' }}>{f.transaction_id}</td>
                              <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{f.payment_date}</td>
                              <td className="px-4 py-2" style={{ color: 'var(--ch-accent)' }}>{f.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
