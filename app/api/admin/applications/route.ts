import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    const certBase = supabaseAdmin.from('certificate_requests')
      .select('id, student_roll_number, student_name, certificate_type, status, created_at, updated_at')
      .order('updated_at', { ascending: false }).limit(100);
    const leaveBase = supabaseAdmin.from('leave_requests')
      .select('id, student_id, reason, from_date, to_date, status, created_at')
      .order('created_at', { ascending: false }).limit(100);
    const feeBase = supabaseAdmin.from('fee_payments')
      .select('id, student_roll_number, student_name, amount, status, created_at, updated_at')
      .order('updated_at', { ascending: false }).limit(100);

    const [certs, leaves, fees] = await Promise.all([
      q ? certBase.or(`student_roll_number.ilike.%${q}%,student_name.ilike.%${q}%`) : certBase,
      leaveBase,
      q ? feeBase.or(`student_roll_number.ilike.%${q}%,student_name.ilike.%${q}%`) : feeBase,
    ]);

    const combined = [
      ...(certs.data || []).map((c: any) => ({
        id: c.id,
        type: 'certificate' as const,
        student_roll_number: c.student_roll_number,
        student_name: c.student_name,
        summary: c.certificate_type,
        status: c.status,
        timestamp: c.updated_at || c.created_at,
      })),
      ...(leaves.data || []).map((l: any) => ({
        id: l.id,
        type: 'leave' as const,
        student_roll_number: null,
        student_name: null,
        summary: `${l.from_date} → ${l.to_date}: ${l.reason.slice(0, 60)}`,
        status: l.status,
        timestamp: l.created_at,
      })),
      ...(fees.data || []).map((f: any) => ({
        id: f.id,
        type: 'fee' as const,
        student_roll_number: f.student_roll_number,
        student_name: f.student_name,
        summary: `₹${Number(f.amount).toLocaleString('en-IN')}`,
        status: f.status,
        timestamp: f.updated_at || f.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ applications: combined });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
