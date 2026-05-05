'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TestTube2, Plus, Trash2, Search } from 'lucide-react';

interface LabMark {
  id: string;
  student_roll: string;
  student_name: string | null;
  subject_code: string;
  subject_name: string | null;
  lab_name: string;
  marks: number;
  total_marks: number;
  evaluated_on: string;
  remarks: string | null;
}

export default function FacultyLabEvaluationsPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [marks, setMarks] = useState<LabMark[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterRoll, setFilterRoll] = useState('');
  const [form, setForm] = useState({
    student_roll: '', subject_code: '', subject_name: '', lab_name: '',
    marks: '', total_marks: '100', evaluated_on: '', remarks: '',
  });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      if (filterSubject) params.set('subject_code', filterSubject);
      if (filterRoll) params.set('student_roll', filterRoll);
      const res = await fetch(`/api/faculty/lab-evaluations?${params}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setMarks(data.marks);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/faculty/lab-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          ...form,
          marks: Number(form.marks),
          total_marks: Number(form.total_marks),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setForm({ student_roll: '', subject_code: '', subject_name: '', lab_name: '', marks: '', total_marks: '100', evaluated_on: '', remarks: '' });
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/faculty/lab-evaluations?id=${id}`, { method: 'DELETE', headers: await authHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      await load();
    } catch (e: any) { setError(e.message); }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const grade = (m: LabMark) => {
    const p = (m.marks / m.total_marks) * 100;
    if (p >= 90) return { letter: 'O', color: '#16a34a' };
    if (p >= 80) return { letter: 'A+', color: '#22c55e' };
    if (p >= 70) return { letter: 'A', color: '#0ea5e9' };
    if (p >= 60) return { letter: 'B', color: '#f59e0b' };
    if (p >= 50) return { letter: 'C', color: '#f97316' };
    return { letter: 'F', color: '#dc2626' };
  };

  return (
    <FacultyLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <TestTube2 className="w-7 h-7" /> Lab Evaluations
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Enter and review lab marks for your students. Grades are calculated automatically.
          </p>
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        <form onSubmit={submit} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Add lab mark</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input required placeholder="Roll no. *" value={form.student_roll} onChange={e => setForm({ ...form, student_roll: e.target.value })} />
            <Input required placeholder="Subject code *" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} />
            <Input placeholder="Subject name" value={form.subject_name} onChange={e => setForm({ ...form, subject_name: e.target.value })} />
            <Input required placeholder="Lab name *" value={form.lab_name} onChange={e => setForm({ ...form, lab_name: e.target.value })} className="md:col-span-2" />
            <Input type="date" placeholder="Evaluated on" value={form.evaluated_on} onChange={e => setForm({ ...form, evaluated_on: e.target.value })} />
            <Input required type="number" step="0.1" placeholder="Marks *" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })} />
            <Input required type="number" step="0.1" placeholder="Total *" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: e.target.value })} />
            <Input placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <Button type="submit" className="gap-2"><Plus className="w-4 h-4" />Save</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input className="pl-9" placeholder="Filter by subject code" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
          </div>
          <Input className="max-w-xs" placeholder="Filter by roll number" value={filterRoll} onChange={e => setFilterRoll(e.target.value)} />
          <Button onClick={load}>Apply</Button>
        </div>

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : marks.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No evaluations recorded yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Student</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Subject</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Lab</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Marks</th>
                  <th className="text-center px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Grade</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Date</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {marks.map(m => {
                  const g = grade(m);
                  return (
                    <tr key={m.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>
                        <div>{m.student_name || '—'}</div>
                        <div className="text-xs font-mono" style={{ color: 'var(--ch-muted)' }}>{m.student_roll}</div>
                      </td>
                      <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>
                        <div>{m.subject_code}</div>
                        {m.subject_name && <div className="text-xs">{m.subject_name}</div>}
                      </td>
                      <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{m.lab_name}</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: 'var(--ch-text)' }}>
                        {Number(m.marks).toFixed(1)}/{Number(m.total_marks).toFixed(0)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-1 rounded font-bold text-xs" style={{ backgroundColor: `${g.color}20`, color: g.color }}>
                          {g.letter}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs" style={{ color: 'var(--ch-muted)' }}>{m.evaluated_on}</td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => remove(m.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
