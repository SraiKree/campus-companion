import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateLibrary(request);
    const body = await request.json();

    const barcode = (body.copy_barcode || '').toString().trim();
    const condition: 'good' | 'damaged' | 'lost' = body.condition || 'good';
    const damageAmount = Number(body.damage_amount || 0);
    if (!barcode) return NextResponse.json({ error: 'copy_barcode required' }, { status: 400 });

    const { data: settings } = await supabaseAdmin
      .from('library_settings')
      .select('fine_per_day')
      .eq('id', 1)
      .single();
    const finePerDay = Number(settings?.fine_per_day || 2);

    const { data: issue } = await supabaseAdmin
      .from('library_issues')
      .select('id, student_roll, due_date, book_id, books ( replacement_cost )')
      .eq('copy_barcode', barcode)
      .in('status', ['active', 'overdue'])
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: 'No active issue for this copy.' }, { status: 404 });

    const today = new Date().toISOString().slice(0, 10);
    const dueDate = issue.due_date;
    const daysLate = Math.max(0, Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000));

    // Update issue
    const issueStatus = condition === 'lost' ? 'lost' : 'returned';
    await supabaseAdmin
      .from('library_issues')
      .update({
        status: issueStatus,
        returned_on: condition === 'lost' ? null : today,
        return_condition: condition,
        returned_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issue.id);

    // Update copy
    const copyCondition = condition === 'good' ? 'good' : condition === 'damaged' ? 'damaged' : 'lost';
    const copyStatus = condition === 'lost' ? 'issued' : 'available';  // lost: copy stays "issued" conceptually — book is gone
    await supabaseAdmin
      .from('book_copies')
      .update({
        status: copyStatus,
        condition: copyCondition,
        updated_at: new Date().toISOString(),
      })
      .eq('barcode', barcode);

    // Create fines
    const fines: Array<{ reason: string; amount: number }> = [];
    if (condition !== 'lost' && daysLate > 0) {
      fines.push({ reason: 'overdue', amount: daysLate * finePerDay });
    }
    if (condition === 'damaged' && damageAmount > 0) {
      fines.push({ reason: 'damage', amount: damageAmount });
    }
    if (condition === 'lost') {
      const book = issue.books as unknown as { replacement_cost: number } | null;
      const cost = Number(book?.replacement_cost || 0);
      if (cost > 0) fines.push({ reason: 'lost', amount: cost });
    }

    if (fines.length) {
      await supabaseAdmin.from('library_fines').insert(
        fines.map(f => ({
          issue_id: issue.id,
          student_roll: issue.student_roll,
          reason: f.reason,
          amount: f.amount,
          handled_by: user.id,
        }))
      );
    }

    return NextResponse.json({
      days_late: daysLate,
      condition,
      fines_created: fines,
      status: issueStatus,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
