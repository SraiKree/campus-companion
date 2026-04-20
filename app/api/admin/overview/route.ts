import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request);

    const [
      studentsRes,
      certPendingRes,
      certReviewRes,
      certIssuedRes,
      leavePendingRes,
      feesPendingRes,
    ] = await Promise.all([
      supabaseAdmin.from('students25').select('roll_number', { count: 'exact', head: true }),
      supabaseAdmin.from('certificate_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabaseAdmin.from('certificate_requests').select('id', { count: 'exact', head: true }).eq('status', 'Under Review'),
      supabaseAdmin.from('certificate_requests').select('id', { count: 'exact', head: true }).eq('status', 'Issued'),
      supabaseAdmin.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('fee_payments').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    ]);

    return NextResponse.json({
      totals: {
        students: studentsRes.count ?? 0,
        certificates_pending: certPendingRes.count ?? 0,
        certificates_under_review: certReviewRes.count ?? 0,
        certificates_issued: certIssuedRes.count ?? 0,
        leave_pending: leavePendingRes.count ?? 0,
        fees_pending: feesPendingRes.count ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
