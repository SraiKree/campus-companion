'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import StudentLayout from '@/components/layout/StudentLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, X } from 'lucide-react';

interface Faculty { id: string; name: string; department: string | null; designation: string | null; }
interface Project {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  team_members: string | null;
  guide_name: string | null;
  file_url: string | null;
  status: string;
  faculty_comments: string | null;
  hod_comments: string | null;
  admin_comments: string | null;
  submitted_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Awaiting faculty', color: '#f59e0b' },
  'faculty-approved': { label: 'Approved by faculty', color: '#0ea5e9' },
  'faculty-rejected': { label: 'Rejected by faculty', color: '#dc2626' },
  'hod-approved': { label: 'Approved by HOD', color: '#7c3aed' },
  'hod-rejected': { label: 'Rejected by HOD', color: '#dc2626' },
  'admin-approved': { label: 'Final approval ✓', color: '#16a34a' },
  'admin-rejected': { label: 'Rejected by admin', color: '#dc2626' },
};

export default function StudentProjectsPage() {
  const { loading, authorized } = useRoleProtection('student');
  const [projects, setProjects] = useState<Project[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', domain: '', team_members: '', guide_id: '', file_url: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const headers = await authHeaders();
      const [pRes, fRes] = await Promise.all([
        fetch('/api/student/projects', { headers }),
        fetch('/api/student/faculty-directory', { headers }),
      ]);
      const pData = await pRes.json();
      const fData = await fRes.json();
      if (!pRes.ok) throw new Error(pData.error || 'Failed to load');
      setProjects(pData.projects);
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
      const res = await fetch('/api/student/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setShowForm(false);
      setForm({ title: '', description: '', domain: '', team_members: '', guide_id: '', file_url: '' });
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
              <ClipboardCheck className="w-7 h-7" /> My Projects
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Submit project proposals for faculty approval. Approval flow: Faculty → HOD → Admin.
            </p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close' : 'Submit Project'}
          </Button>
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        {showForm && (
          <form onSubmit={submit} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <Input required placeholder="Project title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea
              placeholder="Project description"
              className="w-full p-3 rounded-md border text-sm min-h-[100px]"
              style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Domain (e.g. AI/ML)" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
              <Input placeholder="Team members (comma-separated rolls)" value={form.team_members} onChange={e => setForm({ ...form, team_members: e.target.value })} />
              <select
                required
                className="w-full h-10 px-3 rounded-md border text-sm md:col-span-2"
                style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                value={form.guide_id}
                onChange={e => setForm({ ...form, guide_id: e.target.value })}
              >
                <option value="">Select guide faculty *</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}{f.department && ` — ${f.department}`}
                  </option>
                ))}
              </select>
              <Input placeholder="Proposal file URL (Drive link, etc.)" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} className="md:col-span-2" />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Approval'}</Button>
          </form>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>You haven't submitted any projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map(p => {
              const sl = STATUS_LABEL[p.status] || { label: p.status, color: '#64748b' };
              return (
                <div key={p.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{p.title}</p>
                      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                        Guide: {p.guide_name || '—'}{p.domain && ` · ${p.domain}`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${sl.color}20`, color: sl.color }}>
                      {sl.label}
                    </span>
                  </div>
                  {p.description && <p className="text-sm" style={{ color: 'var(--ch-text)' }}>{p.description}</p>}
                  {p.team_members && <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>Team: {p.team_members}</p>}
                  {(p.faculty_comments || p.hod_comments || p.admin_comments) && (
                    <div className="text-xs space-y-1 pt-2 mt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                      {p.faculty_comments && <p><b>Faculty:</b> {p.faculty_comments}</p>}
                      {p.hod_comments && <p><b>HOD:</b> {p.hod_comments}</p>}
                      {p.admin_comments && <p><b>Admin:</b> {p.admin_comments}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
