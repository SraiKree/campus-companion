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
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const [issues, fines] = await Promise.all([
      supabaseAdmin
        .from('library_issues')
        .select(`
          id, copy_barcode, status, issued_on, due_date, returned_on, return_condition,
          books ( title, author )
        `)
        .eq('student_roll', student.roll_number)
        .order('issued_on', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('library_fines')
        .select('id, reason, amount, status, created_at, paid_on')
        .eq('student_roll', student.roll_number)
        .order('created_at', { ascending: false }),
    ]);

    const issueList = issues.data || [];
    const fineList = fines.data || [];
    const unpaidTotal = fineList
      .filter(f => f.status === 'unpaid')
      .reduce((s, f) => s + Number(f.amount), 0);

    return NextResponse.json({
      student,
      active: issueList.filter(i => i.status === 'active' || i.status === 'overdue'),
      history: issueList.filter(i => i.status === 'returned' || i.status === 'lost'),
      fines: fineList,
      unpaid_total: unpaidTotal,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
