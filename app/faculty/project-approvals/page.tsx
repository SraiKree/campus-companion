'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';

interface Project {
  id: string;
  student_roll: string;
  student_name: string | null;
  team_members: string | null;
  title: string;
  description: string | null;
  domain: string | null;
  file_url: string | null;
  status: string;
  faculty_comments: string | null;
  hod_comments: string | null;
  admin_comments: string | null;
  submitted_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#f59e0b',
  'faculty-approved': '#0ea5e9',
  'faculty-rejected': '#dc2626',
  'hod-approved': '#7c3aed',
  'hod-rejected': '#dc2626',
  'admin-approved': '#16a34a',
  'admin-rejected': '#dc2626',
};

export default function FacultyProjectApprovalsPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const url = filter ? `/api/faculty/project-approvals?status=${filter}` : '/api/faculty/project-approvals';
      const res = await fetch(url, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setProjects(data.projects);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized, filter]);

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setActing(id);
    setError(null);
    try {
      const res = await fetch('/api/faculty/project-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, decision, comments: comments[id] || null }),
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
            <ClipboardCheck className="w-7 h-7" /> Project Approvals
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Student projects assigned to you as guide. Approval flow: Faculty → HOD → Admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['', 'submitted', 'faculty-approved', 'faculty-rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border"
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
        ) : projects.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No projects assigned to you yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{p.title}</p>
                    <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                      {p.student_name || p.student_roll} · <span className="font-mono text-xs">{p.student_roll}</span>
                      {p.domain && <span> · {p.domain}</span>}
                    </p>
                    {p.team_members && <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>Team: {p.team_members}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: `${STATUS_COLORS[p.status] || '#64748b'}20`, color: STATUS_COLORS[p.status] || '#64748b' }}>
                    {p.status}
                  </span>
                </div>

                {p.description && <p className="text-sm" style={{ color: 'var(--ch-text)' }}>{p.description}</p>}
                {p.file_url && (
                  <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-2 inline-block" style={{ color: 'var(--ch-accent)' }}>
                    View proposal
                  </a>
                )}

                {p.status === 'submitted' && (
                  <div className="space-y-2 pt-3 mt-3 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <Input
                      placeholder="Comments (optional)"
                      value={comments[p.id] || ''}
                      onChange={e => setComments({ ...comments, [p.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => decide(p.id, 'approve')} disabled={acting === p.id} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="w-4 h-4" /> Approve & forward to HOD
                      </Button>
                      <Button onClick={() => decide(p.id, 'reject')} disabled={acting === p.id} variant="ghost" className="gap-2 text-red-600">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                {(p.faculty_comments || p.hod_comments || p.admin_comments) && (
                  <div className="text-xs space-y-1 pt-2 mt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    {p.faculty_comments && <p><b>Faculty:</b> <span style={{ color: 'var(--ch-muted)' }}>{p.faculty_comments}</span></p>}
                    {p.hod_comments && <p><b>HOD:</b> <span style={{ color: 'var(--ch-muted)' }}>{p.hod_comments}</span></p>}
                    {p.admin_comments && <p><b>Admin:</b> <span style={{ color: 'var(--ch-muted)' }}>{p.admin_comments}</span></p>}
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
