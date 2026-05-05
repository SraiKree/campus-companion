'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import HrLayout from '@/components/layout/HrLayout';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Trash2, Star, FileText, Plus } from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  employee_code: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string | null;
  status: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  basic_salary: number;
  hra: number;
  allowances: number;
  pf_deduction: number;
  tax_deduction: number;
  casual_leave_balance: number;
  sick_leave_balance: number;
  earned_leave_balance: number;
  notes: string | null;
}

interface Doc {
  id: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  uploaded_at: string;
}

interface Review {
  id: string;
  review_period: string;
  rating: number | null;
  strengths: string | null;
  areas_to_improve: string | null;
  reviewer_name: string | null;
  review_date: string;
  remarks: string | null;
}

export default function HrEmployeeDetailPage() {
  const { loading, authorized } = useRoleProtection('hr');
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [reviewForm, setReviewForm] = useState({ review_period: '', rating: '', reviewer_name: '', strengths: '', areas_to_improve: '', remarks: '' });
  const [docForm, setDocForm] = useState({ doc_type: 'other', title: '', file_url: '' });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/hr/employees/${id}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEmployee(data.employee);
      setDocs(data.documents);
      setReviews(data.performance_reviews);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (authorized && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, id]);

  const save = async () => {
    if (!employee) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const { id: _, ...updates } = employee;
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEmployee(data.employee);
      setMsg('Saved.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this employee record? Documents and reviews will also be removed.')) return;
    try {
      const res = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE', headers: await authHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      router.push('/hr/employees');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        employee_id: id,
        review_period: reviewForm.review_period,
        rating: reviewForm.rating ? Number(reviewForm.rating) : null,
        reviewer_name: reviewForm.reviewer_name || null,
        strengths: reviewForm.strengths || null,
        areas_to_improve: reviewForm.areas_to_improve || null,
        remarks: reviewForm.remarks || null,
      };
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add review');
      setReviewForm({ review_period: '', rating: '', reviewer_name: '', strengths: '', areas_to_improve: '', remarks: '' });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ employee_id: id, ...docForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add document');
      setDocForm({ doc_type: 'other', title: '', file_url: '' });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading || !authorized) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <HrLayout>
      <div className="max-w-5xl space-y-6">
        <Link href="/hr/employees" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--ch-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to employees
        </Link>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {msg && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#16a34a' }}>
            {msg}
          </div>
        )}

        {fetching || !employee ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{employee.full_name}</h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
                  {employee.email} · {employee.department || '—'} · {employee.designation || '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving} className="gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="ghost" onClick={remove} className="gap-2 text-red-600"><Trash2 className="w-4 h-4" />Delete</Button>
              </div>
            </div>

            <section className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Full name" value={employee.full_name} onChange={e => setEmployee({ ...employee, full_name: e.target.value })} />
                <Input placeholder="Employee code" value={employee.employee_code || ''} onChange={e => setEmployee({ ...employee, employee_code: e.target.value })} />
                <Input placeholder="Department" value={employee.department || ''} onChange={e => setEmployee({ ...employee, department: e.target.value })} />
                <Input placeholder="Designation" value={employee.designation || ''} onChange={e => setEmployee({ ...employee, designation: e.target.value })} />
                <select
                  className="h-10 px-3 rounded-md border text-sm"
                  style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                  value={employee.employment_type || 'full-time'}
                  onChange={e => setEmployee({ ...employee, employment_type: e.target.value })}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="visiting">Visiting</option>
                </select>
                <select
                  className="h-10 px-3 rounded-md border text-sm"
                  style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                  value={employee.status || 'active'}
                  onChange={e => setEmployee({ ...employee, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On leave</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
                <Input type="date" placeholder="Date of joining" value={employee.date_of_joining || ''} onChange={e => setEmployee({ ...employee, date_of_joining: e.target.value })} />
                <Input type="date" placeholder="Date of birth" value={employee.date_of_birth || ''} onChange={e => setEmployee({ ...employee, date_of_birth: e.target.value })} />
                <Input placeholder="Phone" value={employee.phone || ''} onChange={e => setEmployee({ ...employee, phone: e.target.value })} />
                <Input placeholder="Emergency contact" value={employee.emergency_contact || ''} onChange={e => setEmployee({ ...employee, emergency_contact: e.target.value })} />
                <Input placeholder="Address" value={employee.address || ''} onChange={e => setEmployee({ ...employee, address: e.target.value })} className="md:col-span-2" />
              </div>
            </section>

            <section className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Salary structure</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Input type="number" step="0.01" placeholder="Basic" value={employee.basic_salary} onChange={e => setEmployee({ ...employee, basic_salary: Number(e.target.value) })} />
                <Input type="number" step="0.01" placeholder="HRA" value={employee.hra} onChange={e => setEmployee({ ...employee, hra: Number(e.target.value) })} />
                <Input type="number" step="0.01" placeholder="Allowances" value={employee.allowances} onChange={e => setEmployee({ ...employee, allowances: Number(e.target.value) })} />
                <Input type="number" step="0.01" placeholder="PF deduction" value={employee.pf_deduction} onChange={e => setEmployee({ ...employee, pf_deduction: Number(e.target.value) })} />
                <Input type="number" step="0.01" placeholder="Tax deduction" value={employee.tax_deduction} onChange={e => setEmployee({ ...employee, tax_deduction: Number(e.target.value) })} />
                <div
                  className="h-10 px-3 rounded-md border text-sm flex items-center font-mono"
                  style={{ backgroundColor: 'var(--ch-muted-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  Net: {(employee.basic_salary + employee.hra + employee.allowances - employee.pf_deduction - employee.tax_deduction).toFixed(2)}
                </div>
              </div>
            </section>

            <section className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Leave balances</h2>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Casual" value={employee.casual_leave_balance} onChange={e => setEmployee({ ...employee, casual_leave_balance: Number(e.target.value) })} />
                <Input type="number" placeholder="Sick" value={employee.sick_leave_balance} onChange={e => setEmployee({ ...employee, sick_leave_balance: Number(e.target.value) })} />
                <Input type="number" placeholder="Earned" value={employee.earned_leave_balance} onChange={e => setEmployee({ ...employee, earned_leave_balance: Number(e.target.value) })} />
              </div>
            </section>

            <section className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
                <Star className="w-4 h-4" /> Performance reviews ({reviews.length})
              </h2>
              <form onSubmit={addReview} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input required placeholder="Period (e.g. 2025-26 Annual)" value={reviewForm.review_period} onChange={e => setReviewForm({ ...reviewForm, review_period: e.target.value })} />
                <Input type="number" step="0.1" min="0" max="10" placeholder="Rating (0–10)" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} />
                <Input placeholder="Reviewer name" value={reviewForm.reviewer_name} onChange={e => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })} />
                <Input placeholder="Strengths" value={reviewForm.strengths} onChange={e => setReviewForm({ ...reviewForm, strengths: e.target.value })} />
                <Input placeholder="Areas to improve" value={reviewForm.areas_to_improve} onChange={e => setReviewForm({ ...reviewForm, areas_to_improve: e.target.value })} />
                <Input placeholder="Remarks" value={reviewForm.remarks} onChange={e => setReviewForm({ ...reviewForm, remarks: e.target.value })} />
                <Button type="submit" className="gap-2 md:col-span-2"><Plus className="w-4 h-4" /> Add review</Button>
              </form>
              {reviews.length > 0 && (
                <div className="space-y-2 pt-2">
                  {reviews.map(r => (
                    <div key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--ch-border)' }}>
                      <div className="flex justify-between mb-1">
                        <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>{r.review_period}</p>
                        <p style={{ color: 'var(--ch-muted)' }}>{r.review_date} · {r.rating ?? '—'}/10</p>
                      </div>
                      {r.reviewer_name && <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>by {r.reviewer_name}</p>}
                      {r.strengths && <p className="text-xs mt-1"><b>Strengths:</b> {r.strengths}</p>}
                      {r.areas_to_improve && <p className="text-xs"><b>Improve:</b> {r.areas_to_improve}</p>}
                      {r.remarks && <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>{r.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border p-5 space-y-3" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
                <FileText className="w-4 h-4" /> Documents ({docs.length})
              </h2>
              <form onSubmit={addDoc} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  className="h-10 px-3 rounded-md border text-sm"
                  style={{ backgroundColor: 'var(--ch-input)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                  value={docForm.doc_type}
                  onChange={e => setDocForm({ ...docForm, doc_type: e.target.value })}
                >
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN</option>
                  <option value="passport">Passport</option>
                  <option value="degree">Degree</option>
                  <option value="offer_letter">Offer letter</option>
                  <option value="contract">Contract</option>
                  <option value="experience">Experience</option>
                  <option value="id_proof">ID proof</option>
                  <option value="address_proof">Address proof</option>
                  <option value="other">Other</option>
                </select>
                <Input required placeholder="Title" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} />
                <Input placeholder="File URL (optional)" value={docForm.file_url} onChange={e => setDocForm({ ...docForm, file_url: e.target.value })} />
                <Button type="submit" className="gap-2 md:col-span-3"><Plus className="w-4 h-4" /> Add document</Button>
              </form>
              {docs.length > 0 && (
                <div className="space-y-1 pt-2">
                  {docs.map(d => (
                    <div key={d.id} className="flex justify-between text-sm border-b pb-2" style={{ borderColor: 'var(--ch-border)' }}>
                      <div>
                        <p style={{ color: 'var(--ch-text)' }}>{d.title}</p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{d.doc_type} · {new Date(d.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--ch-accent)' }}>
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </HrLayout>
  );
}
