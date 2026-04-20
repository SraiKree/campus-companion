'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Eye, Upload, FileCheck2, ExternalLink } from 'lucide-react';

type Status = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Issued';

interface CertRequest {
  id: string;
  student_id: string | null;
  student_name: string | null;
  student_roll_number: string | null;
  certificate_type: string;
  purpose: string;
  additional_details?: string | null;
  required_by: string | null;
  status: Status;
  remarks: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  remarks: string | null;
  created_at: string;
}

const TABS: Status[] = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Issued'];

function CertificatesInbox() {
  const searchParams = useSearchParams();
  const { loading, authorized } = useRoleProtection('admin');
  const [tab, setTab] = useState<Status>((searchParams.get('status') as Status) || 'Pending');
  const [items, setItems] = useState<CertRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<CertRequest | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async (status: Status) => {
    try {
      setFetching(true);
      const res = await fetch(`/api/admin/certificates?status=${encodeURIComponent(status)}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.requests);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load(tab);
  }, [authorized, tab]);

  const openDialog = async (r: CertRequest) => {
    setActive(r);
    setRemarks(r.remarks || '');
    setFile(null);
    setError(null);

    const res = await fetch(`/api/admin/certificates?id=${r.id}`, { headers: await authHeaders() });
    const data = await res.json();
    if (res.ok) {
      setActive(data.request);
      setHistory(data.history || []);
    }
  };

  const updateStatus = async (status: Status) => {
    if (!active) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id: active.id, status, remarks }),
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

  const uploadAndIssue = async () => {
    if (!active || !file) {
      setError('Select a signed PDF first');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('id', active.id);
      form.append('file', file);
      if (remarks) form.append('remarks', remarks);
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: await authHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setActive(null);
      load(tab);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Certificate Requests</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Pending → Under Review → Approved → Issued. Reject with remarks if invalid.
          </p>
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

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No {tab.toLowerCase()} requests.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Type</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Purpose</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Req. by</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Applied</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2 font-mono" style={{ color: 'var(--ch-text)' }}>{r.student_roll_number || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{r.student_name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{r.certificate_type}</td>
                    <td className="px-4 py-2 truncate max-w-[220px]" style={{ color: 'var(--ch-muted)' }}>{r.purpose}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{r.required_by || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(r)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.certificate_type} — {active?.student_roll_number}</DialogTitle>
            <DialogDescription>{active?.student_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Purpose</p>
              <p style={{ color: 'var(--ch-text)' }}>{active?.purpose}</p>
            </div>
            {active?.additional_details && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Details</p>
                <p style={{ color: 'var(--ch-text)' }}>{active.additional_details}</p>
              </div>
            )}
            {active?.required_by && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Required by</p>
                <p style={{ color: 'var(--ch-text)' }}>{active.required_by}</p>
              </div>
            )}
            {active?.signed_pdf_url && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Issued document</p>
                <a href={active.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm underline" style={{ color: 'var(--ch-accent)' }}
                >
                  <ExternalLink className="w-4 h-4" /> Open PDF
                </a>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Admin remarks</label>
              <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional note to student..." />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Upload signed PDF (to Issue)</label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            {history.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-muted)' }}>Timeline</p>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs flex gap-2" style={{ color: 'var(--ch-muted)' }}>
                      <span>{new Date(h.created_at).toLocaleString()}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--ch-text)' }}>
                        {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                      </span>
                      {h.remarks && <span>· "{h.remarks}"</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setActive(null)}>Close</Button>
            <Button variant="ghost" onClick={() => updateStatus('Under Review')} disabled={submitting}>
              <Eye className="w-4 h-4 mr-1" /> Under Review
            </Button>
            <Button variant="ghost" onClick={() => updateStatus('Rejected')} disabled={submitting} style={{ color: '#dc2626' }}>
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => updateStatus('Approved')} disabled={submitting}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button onClick={uploadAndIssue} disabled={submitting || !file} style={{ backgroundColor: '#059669', color: '#fff' }}>
              {file ? <><Upload className="w-4 h-4 mr-1" /> Upload & Issue</> : <><FileCheck2 className="w-4 h-4 mr-1" /> Select PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default function AdminCertificatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <CertificatesInbox />
    </Suspense>
  );
}
