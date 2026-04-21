'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import LibraryLayout from '@/components/layout/LibraryLayout';
import { libraryFetch } from '@/lib/library-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, BookOpen, Barcode, CheckCircle, AlertCircle } from 'lucide-react';

interface StudentInfo {
  student: { roll_number: string; name: string; department: string | null };
  active_issues: Array<{ id: string; due_date: string; books: { title: string } | null }>;
  unpaid_fine_total: number;
}
interface CopyInfo {
  copy: {
    barcode: string;
    status: 'available' | 'issued';
    condition: string;
    shelf_location: string | null;
    books: {
      id: string;
      title: string;
      author: string;
      category: string;
      reference_only: boolean;
    };
  };
}

export default function IssuePage() {
  const { loading, authorized } = useRoleProtection('library');
  const [roll, setRoll] = useState('');
  const [barcode, setBarcode] = useState('');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [copy, setCopy] = useState<CopyInfo | null>(null);
  const [lookingUp, setLookingUp] = useState<'student' | 'copy' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lookupStudent = async () => {
    if (!roll.trim()) return;
    setError(null); setLookingUp('student');
    try {
      const data = await libraryFetch(`/api/library/students/lookup?roll=${encodeURIComponent(roll.trim())}`);
      setStudent(data);
    } catch (e: unknown) {
      setError((e as Error).message);
      setStudent(null);
    } finally {
      setLookingUp(null);
    }
  };

  const lookupCopy = async () => {
    if (!barcode.trim()) return;
    setError(null); setLookingUp('copy');
    try {
      const data = await libraryFetch(`/api/library/copies/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
      setCopy(data);
    } catch (e: unknown) {
      setError((e as Error).message);
      setCopy(null);
    } finally {
      setLookingUp(null);
    }
  };

  const handleIssue = async () => {
    if (!student || !copy) return;
    setSubmitting(true);
    setError(null); setSuccess(null);
    try {
      const data = await libraryFetch('/api/library/issue', {
        method: 'POST',
        body: JSON.stringify({
          student_roll: student.student.roll_number,
          copy_barcode: copy.copy.barcode,
        }),
      });
      setSuccess(`Issued "${copy.copy.books.title}" to ${student.student.roll_number}. Due ${new Date(data.issue.due_date).toLocaleDateString()}.`);
      setRoll(''); setBarcode(''); setStudent(null); setCopy(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Auto-focus student input on page load
  }, []);

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const canIssue = student && copy && copy.copy.status === 'available' && copy.copy.condition === 'good' && !copy.copy.books.reference_only;

  return (
    <LibraryLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Issue Book</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Scan student, scan copy, confirm.
          </p>
        </div>

        {/* Student */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Student</h2>
          </div>
          {!student ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={roll}
                onChange={e => setRoll(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') lookupStudent(); }}
                placeholder="Scan or type roll number (e.g. 23R21A1285)"
                className="font-mono"
              />
              <Button onClick={lookupStudent} disabled={lookingUp === 'student' || !roll.trim()}>
                {lookingUp === 'student' ? 'Looking…' : 'Lookup'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono font-semibold" style={{ color: 'var(--ch-text)' }}>{student.student.roll_number}</div>
                  <div className="text-sm" style={{ color: 'var(--ch-muted)' }}>{student.student.name} · {student.student.department}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStudent(null); setRoll(''); }}>Change</Button>
              </div>
              <div className="text-xs grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                <div>
                  <span style={{ color: 'var(--ch-muted)' }}>Currently issued:</span>{' '}
                  <span style={{ color: 'var(--ch-text)' }}>{student.active_issues.length} book{student.active_issues.length === 1 ? '' : 's'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ch-muted)' }}>Unpaid fines:</span>{' '}
                  <span style={{ color: student.unpaid_fine_total > 0 ? '#dc2626' : 'var(--ch-text)' }}>
                    ₹{student.unpaid_fine_total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Barcode className="w-4 h-4" style={{ color: 'var(--ch-accent)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Book Copy</h2>
          </div>
          {!copy ? (
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') lookupCopy(); }}
                placeholder="Scan copy barcode"
                className="font-mono"
                disabled={!student}
              />
              <Button onClick={lookupCopy} disabled={lookingUp === 'copy' || !barcode.trim() || !student}>
                {lookingUp === 'copy' ? 'Looking…' : 'Lookup'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 mt-0.5" style={{ color: 'var(--ch-muted)' }} />
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--ch-text)' }}>{copy.copy.books.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                      {copy.copy.books.author} · {copy.copy.books.category}
                    </div>
                    <div className="text-xs font-mono mt-1" style={{ color: 'var(--ch-muted)' }}>
                      {copy.copy.barcode}{copy.copy.shelf_location ? ` · shelf ${copy.copy.shelf_location}` : ''}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCopy(null); setBarcode(''); }}>Change</Button>
              </div>
              {copy.copy.books.reference_only && (
                <p className="text-xs" style={{ color: '#dc2626' }}>
                  This book is reference-only and cannot be issued.
                </p>
              )}
              {copy.copy.status !== 'available' && (
                <p className="text-xs" style={{ color: '#dc2626' }}>
                  Copy is {copy.copy.status} ({copy.copy.condition}).
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border p-3 text-sm flex items-center gap-2" style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a' }}>
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        <Button
          disabled={!canIssue || submitting}
          onClick={handleIssue}
          className="w-full h-12"
          style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
        >
          {submitting ? 'Issuing…' : 'Confirm Issue'}
        </Button>
      </div>
    </LibraryLayout>
  );
}
