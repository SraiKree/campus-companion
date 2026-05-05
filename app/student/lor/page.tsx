'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import StudentLayout from '@/components/layout/StudentLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileSignature, Plus, X } from 'lucide-react';

interface Faculty { id: string; name: string; department: string | null; designation: string | null; }
interface Request {
  id: string;
  faculty_id: string;
  faculty_name: string | null;
  purpose: string;
  target_institution: string | null;
  application_deadline: string | null;
  message: string | null;
  status: string;
  faculty_response: string | null;
  lor_url: string | null;
  requested_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: '#0ea5e9', completed: '#16a34a', rejected: '#dc2626',
};

export default function StudentLorPage() {
  const { loading, authorized } = useRoleProtection('student');
  const [requests, setRequests] = useState<Request[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    faculty_id: '', purpose: '', target_institution: '', application_deadline: '', message: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const headers = await authHeaders();
      const [rRes, fRes] = await Promise.all([
        fetch('/api/student/lor', { headers }),
        fetch('/api/student/faculty-directory', { headers }),
      ]);
      const rData = await rRes.json();
      const fData = await fRes.json();
      if (!rRes.ok) throw new Error(rData.error || 'Failed to load requests');
      setRequests(rData.requests);
      if (fRes.ok) setFaculty(fData.faculty);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/lor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setShowForm(false);
      setForm({ faculty_id: '', purpose: '', target_institution: '', application_deadline: '', message: '' });
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
              <FileSignature className="w-7 h-7" /> Letter of Recommendation
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Request LORs from faculty for higher studies, internships, or job applications.
            </p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close' : 'New Request'}
          </Button>
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        {showForm && (
          <form onSubmit={submit} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>Faculty *</label>
              <select
                required
                className="w-full h-10 px-3 rounded-md border text-sm"
                style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                value={form.faculty_id}
                onChange={e => setForm({ ...form, faculty_id: e.target.value })}
              >
                <option value="">Select a faculty member...</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}{f.department && ` — ${f.department}`}{f.designation && ` (${f.designation})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input required placeholder="Purpose * (e.g. MS Application)" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
              <Input placeholder="Target institution" value={form.target_institution} onChange={e => setForm({ ...form, target_institution: e.target.value })} />
              <Input type="date" placeholder="Application deadline" value={form.application_deadline} onChange={e => setForm({ ...form, application_deadline: e.target.value })} />
            </div>
            <textarea
              placeholder="Message to faculty (your achievements, why you're applying, etc.)"
              className="w-full p-3 rounded-md border text-sm min-h-[100px]"
              style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
          </form>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>You haven't requested any LORs yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{r.faculty_name || 'Faculty'}</p>
                    <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                      For <b>{r.purpose}</b>{r.target_institution && ` — ${r.target_institution}`}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  Requested {new Date(r.requested_at).toLocaleDateString()}
                  {r.application_deadline && ` · Deadline: ${r.application_deadline}`}
                </p>
                {r.message && (
                  <p className="text-sm mt-2 rounded-lg p-2" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>{r.message}</p>
                )}
                {r.faculty_response && (
                  <p className="text-sm mt-2"><b>Response:</b> {r.faculty_response}</p>
                )}
                {r.lor_url && r.status === 'completed' && (
                  <a href={r.lor_url} target="_blank" rel="noopener noreferrer" className="text-sm underline mt-2 inline-block" style={{ color: 'var(--ch-accent)' }}>
                    Download LOR →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
