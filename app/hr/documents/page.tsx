'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import HrLayout from '@/components/layout/HrLayout';
import { supabase } from '@/lib/supabase';
import { FileText } from 'lucide-react';

interface Doc {
  id: string;
  employee_id: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  uploaded_at: string;
}

export default function HrDocumentsPage() {
  const { loading, authorized } = useRoleProtection('hr');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [empMap, setEmpMap] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token ?? ''}` };

        const [docsRes, employeesRes] = await Promise.all([
          fetch('/api/hr/documents', { headers }),
          fetch('/api/hr/employees?page=1', { headers }),
        ]);

        const docsData = await docsRes.json();
        if (!docsRes.ok) throw new Error(docsData.error || 'Failed to load documents');
        setDocs(docsData.documents);

        const empData = await employeesRes.json();
        if (employeesRes.ok) {
          const map: Record<string, string> = {};
          (empData.employees || []).forEach((e: any) => { map[e.id] = e.full_name; });
          setEmpMap(map);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <HrLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <FileText className="w-7 h-7" /> Documents
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            All employee documents. Upload from an employee's detail page.
          </p>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No documents uploaded yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Employee</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Type</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Title</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Uploaded</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{empMap[d.employee_id] || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{d.doc_type}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>{d.title}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      {d.file_url ? (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--ch-accent)' }}>
                          View
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </HrLayout>
  );
}
