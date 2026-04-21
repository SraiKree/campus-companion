import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const routeId = searchParams.get('route_id');

    // Flip overdue on read (pending + past due)
    const today = new Date().toISOString().slice(0, 10);
    await supabaseAdmin
      .from('transport_fees')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today);

    let query = supabaseAdmin
      .from('transport_fees')
      .select(`
        id, student_roll, amount, due_date, paid_date, payment_ref, status,
        transport_routes ( id, name )
      `)
      .order('due_date', { ascending: true });

    if (status && status !== 'all') query = query.eq('status', status);
    if (routeId) query = query.eq('route_id', routeId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fees: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['amount', 'due_date', 'payment_ref', 'status']) {
      if (k in body) updates[k] = body[k];
    }
    if (body.status === 'paid' && !body.paid_date) {
      updates.paid_date = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabaseAdmin
      .from('transport_fees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fee: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
