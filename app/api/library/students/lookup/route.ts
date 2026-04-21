import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const roll = (searchParams.get('roll') || '').trim().toUpperCase();
    if (!roll) return NextResponse.json({ error: 'roll required' }, { status: 400 });

    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, department')
      .ilike('roll_number', roll)
      .maybeSingle();

    if (!student) return NextResponse.json({ error: 'No student with that roll number' }, { status: 404 });

    const [active, unpaid] = await Promise.all([
      supabaseAdmin
        .from('library_issues')
        .select('id, due_date, books ( title )')
        .eq('student_roll', student.roll_number)
        .in('status', ['active', 'overdue']),
      supabaseAdmin
        .from('library_fines')
        .select('amount')
        .eq('student_roll', student.roll_number)
        .eq('status', 'unpaid'),
    ]);

    const unpaidTotal = (unpaid.data || []).reduce((s, f) => s + Number(f.amount), 0);

    return NextResponse.json({
      student,
      active_issues: active.data || [],
      unpaid_fine_total: unpaidTotal,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
