'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { supabase } from '@/lib/supabase';
import { Briefcase, Star, FileText, AlertCircle } from 'lucide-react';

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
  phone: string | null;
  basic_salary: number;
  hra: number;
  allowances: number;
  pf_deduction: number;
  tax_deduction: number;
  casual_leave_balance: number;
  sick_leave_balance: number;
  earned_leave_balance: number;
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

export default function FacultyHrProfilePage() {
  const { loading, authorized } = useRoleProtection('faculty');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/faculty/hr-profile', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setEmployee(data.employee);
        setDocs(data.documents || []);
        setReviews(data.performance_reviews || []);
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

  const netSalary = employee
    ? employee.basic_salary + employee.hra + employee.allowances - employee.pf_deduction - employee.tax_deduction
    : 0;

  return (
    <FacultyLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <Briefcase className="w-7 h-7" /> My HR Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Your employment record, salary structure, leave balances, and performance reviews.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: 'rgba(220,38,38,0.3)', backgroundColor: 'rgba(220,38,38,0.05)' }}>
            <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#dc2626' }} />
            <div className="text-sm">
              <p className="font-semibold" style={{ color: '#dc2626' }}>{error}</p>
              <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
                If your record is missing, please contact the HR office. They will create your employee record using your faculty email so it appears here automatically.
              </p>
            </div>
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : employee && (
          <>
            <section className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Field label="Name" value={employee.full_name} />
                <Field label="Email" value={employee.email} />
                <Field label="Employee code" value={employee.employee_code} />
                <Field label="Department" value={employee.department} />
                <Field label="Designation" value={employee.designation} />
                <Field label="Employment type" value={employee.employment_type} />
                <Field label="Status" value={employee.status} />
                <Field label="Date of joining" value={employee.date_of_joining} />
                <Field label="Phone" value={employee.phone} />
              </div>
            </section>

            <section className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>Salary structure (monthly)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Field label="Basic" value={employee.basic_salary.toFixed(2)} />
                <Field label="HRA" value={employee.hra.toFixed(2)} />
                <Field label="Allowances" value={employee.allowances.toFixed(2)} />
                <Field label="PF deduction" value={employee.pf_deduction.toFixed(2)} />
                <Field label="Tax deduction" value={employee.tax_deduction.toFixed(2)} />
                <Field label="Net" value={netSalary.toFixed(2)} highlight />
              </div>
            </section>

            <section className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--ch-muted)' }}>Leave balances</h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Field label="Casual" value={String(employee.casual_leave_balance)} />
                <Field label="Sick" value={String(employee.sick_leave_balance)} />
                <Field label="Earned" value={String(employee.earned_leave_balance)} />
              </div>
            </section>

            <section className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
                <Star className="w-4 h-4" /> Performance reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No reviews yet.</p>
              ) : (
                <div className="space-y-2">
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

            <section className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
                <FileText className="w-4 h-4" /> My documents ({docs.length})
              </h2>
              {docs.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No documents on file.</p>
              ) : (
                <div className="space-y-1">
                  {docs.map(d => (
                    <div key={d.id} className="flex justify-between text-sm border-b py-2" style={{ borderColor: 'var(--ch-border)' }}>
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
    </FacultyLayout>
  );
}

function Field({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>{label}</p>
      <p className={highlight ? 'font-bold text-base' : 'text-base'} style={{ color: highlight ? 'var(--ch-accent)' : 'var(--ch-text)' }}>
        {value || '—'}
      </p>
    </div>
  );
}
