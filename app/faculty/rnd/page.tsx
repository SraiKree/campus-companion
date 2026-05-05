'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FlaskConical, Plus, Trash2 } from 'lucide-react';

type Tab = 'publications' | 'patents' | 'projects';

interface Publication { id: string; title: string; authors?: string; journal?: string; publisher?: string; publication_type?: string; year?: number; doi?: string; url?: string; indexed_in?: string; }
interface Patent { id: string; title: string; inventors?: string; application_no?: string; patent_no?: string; filing_date?: string; status?: string; jurisdiction?: string; }
interface Project { id: string; title: string; funding_agency?: string; amount?: number; start_date?: string; end_date?: string; status?: string; description?: string; }

export default function FacultyRndPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [tab, setTab] = useState<Tab>('publications');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<Record<string, any>>({});

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/faculty/rnd', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setPublications(data.publications);
      setPatents(data.patents);
      setProjects(data.projects);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setError(null);
    try {
      const kindMap: Record<Tab, string> = { publications: 'publication', patents: 'patent', projects: 'project' };
      const res = await fetch('/api/faculty/rnd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ kind: kindMap[tab], ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setForm({});
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    const kindMap: Record<Tab, string> = { publications: 'publication', patents: 'patent', projects: 'project' };
    try {
      const res = await fetch(`/api/faculty/rnd?id=${id}&kind=${kindMap[tab]}`, { method: 'DELETE', headers: await authHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      await load();
    } catch (e: any) { setError(e.message); }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <FacultyLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <FlaskConical className="w-7 h-7" /> Research & Development
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Track your publications, patents, and funded projects.
          </p>
        </div>

        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--ch-border)' }}>
          {(['publications', 'patents', 'projects'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setForm({}); }}
              className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition"
              style={{
                color: tab === t ? 'var(--ch-accent)' : 'var(--ch-muted)',
                borderColor: tab === t ? 'var(--ch-accent)' : 'transparent',
              }}
            >
              {t} ({t === 'publications' ? publications.length : t === 'patents' ? patents.length : projects.length})
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        <form onSubmit={submit} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Add new {tab.slice(0, -1)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input required placeholder="Title *" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="md:col-span-2" />
            {tab === 'publications' && <>
              <Input placeholder="Authors" value={form.authors || ''} onChange={e => setForm({ ...form, authors: e.target.value })} />
              <Input placeholder="Journal/Conference" value={form.journal || ''} onChange={e => setForm({ ...form, journal: e.target.value })} />
              <Input type="number" placeholder="Year" value={form.year || ''} onChange={e => setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })} />
              <Input placeholder="DOI" value={form.doi || ''} onChange={e => setForm({ ...form, doi: e.target.value })} />
              <Input placeholder="URL" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} />
              <Input placeholder="Indexed in (e.g. Scopus, SCI)" value={form.indexed_in || ''} onChange={e => setForm({ ...form, indexed_in: e.target.value })} />
            </>}
            {tab === 'patents' && <>
              <Input placeholder="Inventors" value={form.inventors || ''} onChange={e => setForm({ ...form, inventors: e.target.value })} />
              <Input placeholder="Application no." value={form.application_no || ''} onChange={e => setForm({ ...form, application_no: e.target.value })} />
              <Input placeholder="Patent no." value={form.patent_no || ''} onChange={e => setForm({ ...form, patent_no: e.target.value })} />
              <Input type="date" placeholder="Filing date" value={form.filing_date || ''} onChange={e => setForm({ ...form, filing_date: e.target.value })} />
              <Input placeholder="Jurisdiction" value={form.jurisdiction || ''} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} />
              <select className="h-10 px-3 rounded-md border text-sm" style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} value={form.status || 'filed'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="filed">Filed</option><option value="published">Published</option><option value="granted">Granted</option><option value="rejected">Rejected</option>
              </select>
            </>}
            {tab === 'projects' && <>
              <Input placeholder="Funding agency" value={form.funding_agency || ''} onChange={e => setForm({ ...form, funding_agency: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Amount" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value ? Number(e.target.value) : undefined })} />
              <Input type="date" placeholder="Start" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input type="date" placeholder="End" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              <select className="h-10 px-3 rounded-md border text-sm" style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} value={form.status || 'ongoing'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="proposed">Proposed</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="closed">Closed</option>
              </select>
              <Input placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
            </>}
          </div>
          <Button type="submit" className="gap-2"><Plus className="w-4 h-4" />Add</Button>
        </form>

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : (
          <div className="space-y-2">
            {tab === 'publications' && publications.map(p => (
              <RnDCard key={p.id} title={p.title} subtitle={[p.authors, p.journal, p.year ? String(p.year) : null].filter(Boolean).join(' · ')} extra={p.indexed_in ? `Indexed in: ${p.indexed_in}` : undefined} onDelete={() => remove(p.id)} link={p.url || (p.doi ? `https://doi.org/${p.doi}` : undefined)} />
            ))}
            {tab === 'patents' && patents.map(p => (
              <RnDCard key={p.id} title={p.title} subtitle={[p.inventors, p.status, p.jurisdiction].filter(Boolean).join(' · ')} extra={[p.application_no && `App: ${p.application_no}`, p.patent_no && `Patent: ${p.patent_no}`, p.filing_date].filter(Boolean).join(' · ')} onDelete={() => remove(p.id)} />
            ))}
            {tab === 'projects' && projects.map(p => (
              <RnDCard key={p.id} title={p.title} subtitle={[p.funding_agency, p.status, p.amount ? `₹${p.amount}` : null].filter(Boolean).join(' · ')} extra={p.description || `${p.start_date || ''} → ${p.end_date || ''}`} onDelete={() => remove(p.id)} />
            ))}
            {((tab === 'publications' && publications.length === 0) || (tab === 'patents' && patents.length === 0) || (tab === 'projects' && projects.length === 0)) && (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No records yet.</p>
            )}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

function RnDCard({ title, subtitle, extra, link, onDelete }: { title: string; subtitle?: string; extra?: string; link?: string; onDelete: () => void }) {
  return (
    <div className="rounded-xl border p-4 flex justify-between items-start" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
      <div className="flex-1">
        <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{title}</p>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>{subtitle}</p>}
        {extra && <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>{extra}</p>}
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 inline-block" style={{ color: 'var(--ch-accent)' }}>Open link</a>}
      </div>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
}
