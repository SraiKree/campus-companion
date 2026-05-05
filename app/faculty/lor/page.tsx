'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileSignature, CheckCircle2, XCircle, Upload } from 'lucide-react';

interface LORRequest {
  id: string;
  student_roll: string;
  student_name: string | null;
  student_email: string | null;
  purpose: string;
  target_institution: string | null;
  application_deadline: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  faculty_response: string | null;
  lor_url: string | null;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: '#0ea5e9', completed: '#16a34a', rejected: '#dc2626',
};

export default function FacultyLorPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [requests, setRequests] = useState<LORRequest[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [lorUrl, setLorUrl] = useState<Record<string, string>>({});

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const url = filter ? `/api/faculty/lor?status=${filter}` : '/api/faculty/lor';
      const res = await fetch(url, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRequests(data.requests);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized, filter]);

  const decide = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    setActing(id);
    setError(null);
    try {
      const body: any = { id, status, faculty_response: responseText[id] || null };
      if (status === 'completed') body.lor_url = lorUrl[id] || null;
      const res = await fetch('/api/faculty/lor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setActing(null); }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <FacultyLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <FileSignature className="w-7 h-7" /> Letters of Recommendation
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            LOR requests from students. Approve, reject, or upload the completed letter.
          </p>
        </div>

        <div className="flex gap-2">
          {['', 'pending', 'approved', 'completed', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize"
              style={{
                backgroundColor: filter === s ? 'var(--ch-accent)' : 'var(--ch-card)',
                color: filter === s ? '#fff' : 'var(--ch-muted)',
                borderColor: 'var(--ch-border)',
              }}
            >
              {s || 'all'}
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No LOR requests {filter && `(${filter})`}.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                      {r.student_name || r.student_roll} <span className="font-mono text-xs" style={{ color: 'var(--ch-muted)' }}>· {r.student_roll}</span>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                      For <b>{r.purpose}</b>{r.target_institution && ` — ${r.target_institution}`}
                      {r.application_deadline && <span> · Deadline: {r.application_deadline}</span>}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                    {r.status}
                  </span>
                </div>

                {r.message && (
                  <div className="text-sm rounded-lg p-3 my-2" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>
                    {r.message}
                  </div>
                )}

                {r.status === 'pending' && (
                  <div className="space-y-2 pt-2">
                    <Input
                      placeholder="Your response (optional)"
                      value={responseText[r.id] || ''}
                      onChange={e => setResponseText({ ...responseText, [r.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => decide(r.id, 'approved')} disabled={acting === r.id} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button onClick={() => decide(r.id, 'rejected')} disabled={acting === r.id} variant="ghost" className="gap-2 text-red-600">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {r.status === 'approved' && (
                  <div className="space-y-2 pt-2">
                    <Input
                      placeholder="LOR document URL"
                      value={lorUrl[r.id] || ''}
                      onChange={e => setLorUrl({ ...lorUrl, [r.id]: e.target.value })}
                    />
                    <Button onClick={() => decide(r.id, 'completed')} disabled={acting === r.id} className="gap-2">
                      <Upload className="w-4 h-4" /> Mark completed
                    </Button>
                  </div>
                )}

                {(r.status === 'completed' || r.status === 'rejected') && (
                  <div className="pt-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                    {r.faculty_response && <p>Note: {r.faculty_response}</p>}
                    {r.lor_url && <a href={r.lor_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--ch-accent)' }}>View letter</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
