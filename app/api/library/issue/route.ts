import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateLibrary(request);
    const body = await request.json();

    const roll = (body.student_roll || '').toString().trim().toUpperCase();
    const barcode = (body.copy_barcode || '').toString().trim();
    if (!roll || !barcode) {
      return NextResponse.json({ error: 'student_roll and copy_barcode required' }, { status: 400 });
    }

    const { data: settings } = await supabaseAdmin
      .from('library_settings')
      .select('loan_period_days, max_books_per_student, fine_block_threshold')
      .eq('id', 1)
      .single();
    const loanPeriod = settings?.loan_period_days || 14;
    const maxBooks = settings?.max_books_per_student || 3;
    const blockThreshold = Number(settings?.fine_block_threshold || 100);

    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name')
      .ilike('roll_number', roll)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const { data: copy } = await supabaseAdmin
      .from('book_copies')
      .select('barcode, status, condition, book_id, books ( reference_only )')
      .eq('barcode', barcode)
      .maybeSingle();
    if (!copy) return NextResponse.json({ error: 'Copy not found' }, { status: 404 });
    const book = copy.books as unknown as { reference_only: boolean } | null;
    if (book?.reference_only) {
      return NextResponse.json({ error: 'This book is reference-only and cannot be issued.' }, { status: 400 });
    }
    if (copy.status !== 'available' || copy.condition !== 'good') {
      return NextResponse.json({ error: `Copy is not available (status: ${copy.status}, condition: ${copy.condition}).` }, { status: 409 });
    }

    // Student limit check
    const { count: activeCount } = await supabaseAdmin
      .from('library_issues')
      .select('*', { count: 'exact', head: true })
      .eq('student_roll', student.roll_number)
      .in('status', ['active', 'overdue']);
    if ((activeCount || 0) >= maxBooks) {
      return NextResponse.json({ error: `Student already holds ${activeCount} books (max ${maxBooks}).` }, { status: 409 });
    }

    // Fine block check
    const { data: fines } = await supabaseAdmin
      .from('library_fines')
      .select('amount')
      .eq('student_roll', student.roll_number)
      .eq('status', 'unpaid');
    const unpaidTotal = (fines || []).reduce((s, f) => s + Number(f.amount), 0);
    if (!body.override && unpaidTotal >= blockThreshold) {
      return NextResponse.json({
        error: `Student has ₹${unpaidTotal} in unpaid fines (threshold ₹${blockThreshold}). Collect first or override.`,
      }, { status: 409 });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanPeriod);

    const { data: issue, error: issueErr } = await supabaseAdmin
      .from('library_issues')
      .insert({
        student_roll: student.roll_number,
        student_name: student.name,
        copy_barcode: barcode,
        book_id: copy.book_id,
        due_date: dueDate.toISOString().slice(0, 10),
        issued_by: user.id,
      })
      .select()
      .single();
    if (issueErr) return NextResponse.json({ error: issueErr.message }, { status: 500 });

    await supabaseAdmin
      .from('book_copies')
      .update({ status: 'issued', updated_at: new Date().toISOString() })
      .eq('barcode', barcode);

    return NextResponse.json({ issue, loan_period: loanPeriod }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
