'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, Barcode } from 'lucide-react';

interface Copy {
  barcode: string;
  status: 'available' | 'issued';
  condition: 'good' | 'damaged' | 'lost' | 'out_of_service';
  shelf_location: string | null;
}
interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string | null;
  publisher: string | null;
  year_published: number | null;
  edition: string | null;
  reference_only: boolean;
  replacement_cost: number;
  book_copies: Copy[];
  total_copies: number;
  available_copies: number;
  issued_copies: number;
}

const CATEGORIES = ['textbook', 'reference', 'fiction', 'non-fiction', 'periodical', 'other'];
const emptyForm = {
  title: '', author: '', category: 'textbook',
  isbn: '', publisher: '', year_published: '', edition: '',
  reference_only: false, replacement_cost: '',
};

export default function BooksPage() {
  const { loading, authorized } = useRoleProtection('library');
  const [books, setBooks] = useState<Book[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [initialBarcodes, setInitialBarcodes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [copyBarcode, setCopyBarcode] = useState('');
  const [copyShelf, setCopyShelf] = useState('');
  const [addingCopyTo, setAddingCopyTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category !== 'all') params.set('category', category);
      if (availableOnly) params.set('available', 'true');
      const data = await libraryFetch(`/api/library/books?${params.toString()}`);
      setBooks(data.books);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, [search, category, availableOnly]);

  useEffect(() => {
    if (!authorized) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [authorized, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setInitialBarcodes('');
    setOpen(true);
  };
  const openEdit = (b: Book) => {
    setEditing(b);
    setForm({
      title: b.title, author: b.author, category: b.category,
      isbn: b.isbn || '', publisher: b.publisher || '',
      year_published: b.year_published?.toString() || '',
      edition: b.edition || '',
      reference_only: b.reference_only,
      replacement_cost: b.replacement_cost.toString(),
    });
    setInitialBarcodes('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        isbn: form.isbn.trim() || null,
        publisher: form.publisher.trim() || null,
        year_published: form.year_published ? Number(form.year_published) : null,
        edition: form.edition.trim() || null,
        reference_only: form.reference_only,
        replacement_cost: Number(form.replacement_cost || 0),
        ...(editing ? {} : {
          barcodes: initialBarcodes.split(/[\n,\s]+/).map(b => b.trim()).filter(Boolean),
        }),
      };
      if (editing) {
        await libraryFetch(`/api/library/books?id=${editing.id}`, {
          method: 'PATCH', body: JSON.stringify(payload),
        });
      } else {
        await libraryFetch('/api/library/books', {
          method: 'POST', body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (b: Book) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    try {
      await libraryFetch(`/api/library/books?id=${b.id}`, { method: 'DELETE' });
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleAddCopy = async (bookId: string) => {
    if (!copyBarcode.trim()) return;
    try {
      await libraryFetch('/api/library/books/copies', {
        method: 'POST',
        body: JSON.stringify({
          book_id: bookId,
          barcode: copyBarcode.trim(),
          shelf_location: copyShelf.trim() || null,
        }),
      });
      setCopyBarcode(''); setCopyShelf('');
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleDeleteCopy = async (barcode: string) => {
    if (!confirm(`Remove copy ${barcode}?`)) return;
    try {
      await libraryFetch(`/api/library/books/copies?barcode=${encodeURIComponent(barcode)}`, {
        method: 'DELETE',
      });
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <LibraryLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Books</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              {books.length} title{books.length === 1 ? '' : 's'}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit Book' : 'Add Book'}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Title</label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Author</label>
                  <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Category</label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>ISBN</label>
                    <Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Publisher</label>
                    <Input value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Year</label>
                    <Input type="number" value={form.year_published} onChange={e => setForm({ ...form, year_published: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Edition</label>
                    <Input value={form.edition} onChange={e => setForm({ ...form, edition: e.target.value })} placeholder="3rd" />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Replacement cost (₹)</label>
                    <Input type="number" value={form.replacement_cost} onChange={e => setForm({ ...form, replacement_cost: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-text)' }}>
                  <input type="checkbox" checked={form.reference_only} onChange={e => setForm({ ...form, reference_only: e.target.checked })} />
                  Reference only (cannot be issued)
                </label>
                {!editing && (
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--ch-muted)' }}>
                      <Barcode className="w-3 h-3" /> Copy barcodes (one per line — scan each physical copy)
                    </label>
                    <textarea
                      value={initialBarcodes}
                      onChange={e => setInitialBarcodes(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border p-2 text-sm font-mono"
                      style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                      placeholder="LIB-00001&#10;LIB-00002&#10;LIB-00003"
                    />
                  </div>
                )}
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={submitting || !form.title || !form.author}
                  onClick={handleSubmit}
                  style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
                >
                  {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, author, ISBN, or scan barcode…"
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm px-3" style={{ color: 'var(--ch-text)' }}>
            <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} />
            Available only
          </label>
        </div>

        {error && !open && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : books.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No books found.</p>
        ) : (
          <div className="space-y-2">
            {books.map(b => {
              const isOpen = expanded === b.id;
              return (
                <div key={b.id} className="rounded-xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <div className="flex items-start justify-between p-4">
                    <button onClick={() => setExpanded(isOpen ? null : b.id)} className="flex items-start gap-2 flex-1 text-left">
                      {isOpen ? <ChevronDown className="w-4 h-4 mt-1" /> : <ChevronRight className="w-4 h-4 mt-1" />}
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                          {b.title}
                          {b.reference_only && (
                            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                              backgroundColor: 'rgba(234,179,8,0.1)', color: '#ca8a04',
                            }}>reference</span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                          {b.author} · {b.category}{b.isbn ? ` · ISBN ${b.isbn}` : ''}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs" style={{ color: 'var(--ch-muted)' }}>
                        <div><span className="font-semibold" style={{ color: 'var(--ch-text)' }}>{b.available_copies}</span> / {b.total_copies} available</div>
                        <div>{b.issued_copies} issued</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBook(b)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t px-4 py-3" style={{ borderColor: 'var(--ch-border)' }}>
                      {b.book_copies.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>No copies yet.</p>
                      ) : (
                        <table className="w-full text-sm mb-3">
                          <thead>
                            <tr>
                              <th className="text-left pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Barcode</th>
                              <th className="text-left pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Shelf</th>
                              <th className="text-left pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Condition</th>
                              <th className="text-left pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Status</th>
                              <th className="text-right pb-1" />
                            </tr>
                          </thead>
                          <tbody>
                            {b.book_copies.map(c => (
                              <tr key={c.barcode} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                                <td className="py-2 font-mono text-xs" style={{ color: 'var(--ch-text)' }}>{c.barcode}</td>
                                <td className="py-2 text-xs" style={{ color: 'var(--ch-text)' }}>{c.shelf_location || '—'}</td>
                                <td className="py-2 text-xs" style={{ color: 'var(--ch-text)' }}>{c.condition}</td>
                                <td className="py-2 text-xs">
                                  <span className="font-semibold px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: c.status === 'available' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                    color: c.status === 'available' ? '#16a34a' : '#ca8a04',
                                  }}>{c.status}</span>
                                </td>
                                <td className="py-2 text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCopy(c.barcode)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {addingCopyTo === b.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={copyBarcode}
                            onChange={e => setCopyBarcode(e.target.value)}
                            placeholder="Scan barcode"
                            className="font-mono"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleAddCopy(b.id); }}
                          />
                          <Input
                            value={copyShelf}
                            onChange={e => setCopyShelf(e.target.value)}
                            placeholder="Shelf (e.g. A3-12)"
                            className="w-40"
                          />
                          <Button size="sm" onClick={() => handleAddCopy(b.id)}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAddingCopyTo(null); setCopyBarcode(''); setCopyShelf(''); }}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setAddingCopyTo(b.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Add copy
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LibraryLayout>
  );
}
