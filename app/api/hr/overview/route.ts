import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHr } from '@/lib/hr-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateHr(request);

    const [
      employeesRes,
      activeRes,
      onLeaveRes,
      reviewsRes,
      docsRes,
    ] = await Promise.all([
      supabaseAdmin.from('hr_employees').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('hr_employees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('hr_employees').select('id', { count: 'exact', head: true }).eq('status', 'on-leave'),
      supabaseAdmin.from('hr_performance_reviews').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('hr_documents').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      totals: {
        employees: employeesRes.count ?? 0,
        active: activeRes.count ?? 0,
        on_leave: onLeaveRes.count ?? 0,
        performance_reviews: reviewsRes.count ?? 0,
        documents: docsRes.count ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
