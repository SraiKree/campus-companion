import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const barcode = (searchParams.get('barcode') || '').trim();
    if (!barcode) return NextResponse.json({ error: 'barcode required' }, { status: 400 });

    const { data: copy } = await supabaseAdmin
      .from('book_copies')
      .select(`
        barcode, status, condition, shelf_location,
        books ( id, title, author, category, reference_only, replacement_cost )
      `)
      .eq('barcode', barcode)
      .maybeSingle();

    if (!copy) return NextResponse.json({ error: 'No copy with that barcode' }, { status: 404 });

    // If issued, also fetch the active issue for return flow
    let activeIssue = null;
    if (copy.status === 'issued') {
      const { data: issue } = await supabaseAdmin
        .from('library_issues')
        .select('id, student_roll, student_name, issued_on, due_date, status')
        .eq('copy_barcode', barcode)
        .in('status', ['active', 'overdue'])
        .maybeSingle();
      activeIssue = issue;
    }

    return NextResponse.json({ copy, active_issue: activeIssue });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
