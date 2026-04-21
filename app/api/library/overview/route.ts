import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateLibrary(request);

    const today = new Date().toISOString().slice(0, 10);

    // Auto-flip overdue
    await supabaseAdmin
      .from('library_issues')
      .update({ status: 'overdue' })
      .eq('status', 'active')
      .lt('due_date', today);

    const [titles, copies, issues, fines, mostOverdue] = await Promise.all([
      supabaseAdmin.from('books').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('book_copies').select('status', { count: 'exact' }),
      supabaseAdmin.from('library_issues').select('id, status, issued_on, returned_on'),
      supabaseAdmin.from('library_fines').select('amount, status, created_at'),
      supabaseAdmin
        .from('library_issues')
        .select('id, student_roll, student_name, due_date, books (title)')
        .eq('status', 'overdue')
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    const copyList = copies.data || [];
    const totalCopies = copyList.length;
    const availableCopies = copyList.filter(c => c.status === 'available').length;
    const issuedCopies = copyList.filter(c => c.status === 'issued').length;

    const issueList = issues.data || [];
    const issuedToday = issueList.filter(i => i.issued_on === today).length;
    const returnedToday = issueList.filter(i => i.returned_on === today).length;
    const overdue = issueList.filter(i => i.status === 'overdue').length;

    const monthStart = today.slice(0, 7) + '-01';
    const feeList = fines.data || [];
    const collectedThisMonth = feeList
      .filter(f => f.status === 'paid' && f.created_at >= monthStart)
      .reduce((s, f) => s + Number(f.amount), 0);
    const unpaid = feeList
      .filter(f => f.status === 'unpaid')
      .reduce((s, f) => s + Number(f.amount), 0);

    return NextResponse.json({
      catalogue: {
        titles: titles.count || 0,
        totalCopies,
        availableCopies,
        issuedCopies,
      },
      today: { issued: issuedToday, returned: returnedToday },
      overdue: {
        count: overdue,
        list: mostOverdue.data || [],
      },
      fines: {
        collectedThisMonth,
        unpaid,
      },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
