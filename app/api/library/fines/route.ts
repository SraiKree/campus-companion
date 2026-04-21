import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const roll = searchParams.get('roll');

    let query = supabaseAdmin
      .from('library_fines')
      .select(`
        id, student_roll, reason, amount, status, payment_ref, paid_on, waiver_reason, created_at,
        library_issues ( id, copy_barcode, books ( title ) )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (roll) query = query.eq('student_roll', roll.toUpperCase());

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fines: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      handled_by: user.id,
    };
    if ('status' in body) updates.status = body.status;
    if ('payment_ref' in body) updates.payment_ref = body.payment_ref;
    if ('waiver_reason' in body) updates.waiver_reason = body.waiver_reason;
    if (body.status === 'paid' && !body.paid_on) {
      updates.paid_on = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabaseAdmin
      .from('library_fines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fine: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
