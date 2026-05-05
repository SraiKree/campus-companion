'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Library, Search } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string | null;
  publisher: string | null;
  year_published: number | null;
  edition: string | null;
  total_copies: number;
  available_copies: number;
}

export default function FacultyLibraryPage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [q, setQ] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await fetch(`/api/faculty/library${params}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setBooks(data.books);
    } catch (e: any) { setError(e.message); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (authorized) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authorized]);

  const search = (e: React.FormEvent) => { e.preventDefault(); load(); };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <FacultyLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <Library className="w-7 h-7" /> Library Catalog
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Browse the campus library. Visit the library counter to issue books.
          </p>
        </div>

        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input className="pl-9" placeholder="Search title, author, ISBN..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {error && <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : books.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No books match your search.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Title</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Author</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Category</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Publisher</th>
                  <th className="text-right px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Available</th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-text)' }}>
                      <div className="font-medium">{b.title}</div>
                      {b.isbn && <div className="text-xs font-mono" style={{ color: 'var(--ch-muted)' }}>{b.isbn}</div>}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{b.author}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>{b.category}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--ch-muted)' }}>
                      {b.publisher || '—'}{b.year_published ? ` · ${b.year_published}` : ''}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium font-mono"
                        style={{
                          backgroundColor: b.available_copies > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
                          color: b.available_copies > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {b.available_copies} / {b.total_copies}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
