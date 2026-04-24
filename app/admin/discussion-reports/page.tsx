'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Flag, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DiscussionReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  status: 'pending' | 'actioned' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  message: {
    id: string;
    subject_code: string;
    subject_name: string | null;
    user_id: string;
    user_name: string;
    user_role: string;
    user_department: string | null;
    user_section: string | null;
    content: string;
    is_hidden: boolean;
    created_at: string;
  } | null;
}

type StatusTab = 'pending' | 'actioned' | 'dismissed';

export default function AdminDiscussionReportsPage() {
  const { loading, authorized } = useRoleProtection('admin');
  const [tab, setTab] = useState<StatusTab>('pending');
  const [reports, setReports] = useState<DiscussionReport[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await fetch(`/api/admin/discussion-reports?status=${tab}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setReports(data.reports || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, tab]);

  const act = async (id: string, action: 'hide' | 'dismiss') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/discussion-reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
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
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>Discussion Reports</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              Messages reported by students in course discussions.
            </p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'actioned', 'dismissed'] as StatusTab[]).map(s => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: tab === s ? 'var(--ch-accent)' : 'var(--ch-card)',
                  color: tab === s ? 'white' : 'var(--ch-text)',
                  borderColor: tab === s ? 'var(--ch-accent)' : 'var(--ch-border)',
                }}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        {fetching ? (
          <div className="py-16 text-center" style={{ color: 'var(--ch-muted)' }}>Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border" style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-card)' }}>
            <Flag className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--ch-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No {tab} reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div
                key={r.id}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                        Reported by {r.reporter_name}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--ch-text)' }}>
                      <span className="font-semibold">Reason:</span> {r.reason}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => act(r.id, 'hide')}
                        disabled={busyId === r.id}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act(r.id, 'dismiss')}
                        disabled={busyId === r.id}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                  {r.status !== 'pending' && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: r.status === 'actioned' ? 'rgba(220,38,38,0.1)' : 'rgba(16,185,129,0.1)',
                        color: r.status === 'actioned' ? '#dc2626' : '#059669',
                      }}
                    >
                      {r.status}
                    </span>
                  )}
                </div>

                {r.message ? (
                  <div
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: 'var(--ch-muted-bg)', borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                        <span className="font-bold" style={{ color: 'var(--ch-text)' }}>
                          {r.message.user_name}
                        </span>
                        <span>•</span>
                        <span>{r.message.subject_code}{r.message.subject_name ? ` — ${r.message.subject_name}` : ''}</span>
                        {(r.message.user_department || r.message.user_section) && (
                          <>
                            <span>•</span>
                            <span>{[r.message.user_department, r.message.user_section].filter(Boolean).join(' / ')}</span>
                          </>
                        )}
                      </div>
                      {r.message.is_hidden && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--ch-text)' }}>
                      {r.message.content}
                    </p>
                    <p className="text-[11px] mt-2" style={{ color: 'var(--ch-muted)' }}>
                      Posted {new Date(r.message.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 border text-sm italic" style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}>
                    Original message has been deleted.
                  </div>
                )}

                {r.resolution_notes && (
                  <p className="text-xs mt-3" style={{ color: 'var(--ch-muted)' }}>
                    <span className="font-semibold">Admin notes:</span> {r.resolution_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
