import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { data, error } = await supabaseAdmin
      .from('transport_notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notifications: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateTransport(request);
    const body = await request.json();

    const type = body.type;
    const audience_type = body.audience_type;
    const audience_ref = body.audience_ref || null;
    const message = (body.message || '').toString().trim();

    if (!type || !audience_type || !message) {
      return NextResponse.json({ error: 'type, audience_type, message required' }, { status: 400 });
    }
    if (audience_type !== 'overdue_all' && !audience_ref) {
      return NextResponse.json({ error: 'audience_ref required for this audience type' }, { status: 400 });
    }

    // Resolve recipient count
    let recipient_count = 0;
    if (audience_type === 'bus') {
      const { count } = await supabaseAdmin
        .from('transport_assignments').select('*', { count: 'exact', head: true })
        .eq('bus_id', audience_ref).eq('status', 'active');
      recipient_count = count || 0;
    } else if (audience_type === 'route') {
      const { count } = await supabaseAdmin
        .from('transport_assignments').select('*', { count: 'exact', head: true })
        .eq('route_id', audience_ref).eq('status', 'active');
      recipient_count = count || 0;
    } else if (audience_type === 'stop') {
      const { count } = await supabaseAdmin
        .from('transport_assignments').select('*', { count: 'exact', head: true })
        .eq('stop_id', audience_ref).eq('status', 'active');
      recipient_count = count || 0;
    } else if (audience_type === 'student') {
      recipient_count = 1;
    } else if (audience_type === 'overdue_all') {
      const { count } = await supabaseAdmin
        .from('transport_fees').select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');
      recipient_count = count || 0;
    }

    if (recipient_count === 0) {
      return NextResponse.json({ error: 'Audience resolved to 0 recipients.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('transport_notifications')
      .insert({
        type, audience_type, audience_ref,
        message, recipient_count,
        sent_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notification: data }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
