'use client';

import { useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import HrLayout from '@/components/layout/HrLayout';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  employee_id: string;
  review_period: string;
  rating: number | null;
  strengths: string | null;
  areas_to_improve: string | null;
  reviewer_name: string | null;
  review_date: string;
  remarks: string | null;
}

export default function HrPerformancePage() {
  const { loading, authorized } = useRoleProtection('hr');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [empMap, setEmpMap] = useState<Record<string, { full_name: string; department: string | null }>>({});
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token ?? ''}` };

        const [reviewsRes, employeesRes] = await Promise.all([
          fetch('/api/hr/performance', { headers }),
          fetch('/api/hr/employees?page=1', { headers }),
        ]);

        const reviewsData = await reviewsRes.json();
        if (!reviewsRes.ok) throw new Error(reviewsData.error || 'Failed to load reviews');
        setReviews(reviewsData.reviews);

        const empData = await employeesRes.json();
        if (employeesRes.ok) {
          const map: Record<string, { full_name: string; department: string | null }> = {};
          (empData.employees || []).forEach((e: any) => {
            map[e.id] = { full_name: e.full_name, department: e.department };
          });
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
            <Star className="w-7 h-7" /> Performance Reviews
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            All performance reviews across employees. Add new reviews from an employee's detail page.
          </p>
        </div>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => {
              const emp = empMap[r.employee_id];
              return (
                <div key={r.id} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                        {emp?.full_name || 'Unknown employee'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        {emp?.department || '—'} · {r.review_period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: 'var(--ch-accent)' }}>{r.rating ?? '—'}/10</p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{r.review_date}</p>
                    </div>
                  </div>
                  {r.reviewer_name && <p className="text-xs mb-1" style={{ color: 'var(--ch-muted)' }}>Reviewed by {r.reviewer_name}</p>}
                  {r.strengths && <p className="text-sm"><b>Strengths:</b> {r.strengths}</p>}
                  {r.areas_to_improve && <p className="text-sm"><b>Improve:</b> {r.areas_to_improve}</p>}
                  {r.remarks && <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>{r.remarks}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </HrLayout>
  );
}
