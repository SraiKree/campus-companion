import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function POST(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const body = await request.json();

    const route_id = body.route_id;
    const stop_name = (body.stop_name || '').toString().trim();
    const pickup_time = body.pickup_time;
    if (!route_id || !stop_name || !pickup_time) {
      return NextResponse.json({ error: 'route_id, stop_name, pickup_time required' }, { status: 400 });
    }

    // Next stop_order
    const { data: existing } = await supabaseAdmin
      .from('transport_route_stops')
      .select('stop_order')
      .eq('route_id', route_id)
      .order('stop_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const stop_order = (existing?.stop_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('transport_route_stops')
      .insert({
        route_id,
        stop_name,
        landmark: body.landmark || null,
        pickup_time,
        stop_order,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ stop: data }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { count } = await supabaseAdmin
      .from('transport_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('stop_id', id)
      .eq('status', 'active');

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `${count} students assigned to this stop. Reassign first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('transport_route_stops').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
