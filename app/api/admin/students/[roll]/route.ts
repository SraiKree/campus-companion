import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ roll: string }> }) {
  try {
    await authenticateAdmin(request);
    const { roll } = await params;
    const rollNumber = decodeURIComponent(roll).toUpperCase();

    const { data: student, error: sErr } = await supabaseAdmin
      .from('students25')
      .select('*')
      .ilike('roll_number', rollNumber)
      .single();

    if (sErr || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const [certsRes, leavesRes, feesRes] = await Promise.all([
      supabaseAdmin.from('certificate_requests')
        .select('id, certificate_type, purpose, status, created_at, updated_at, signed_pdf_url')
        .eq('student_roll_number', student.roll_number)
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('leave_requests')
        .select('id, reason, from_date, to_date, status, created_at')
        .eq('student_id', student.id ?? '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('fee_payments')
        .select('id, amount, transaction_id, payment_date, status, remarks, created_at')
        .eq('student_roll_number', student.roll_number)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      student,
      certificates: certsRes.data || [],
      leave_requests: leavesRes.data || [],
      fee_payments: feesRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
