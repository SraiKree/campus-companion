import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .select(`
        id, name, distance_km, fee_amount, status,
        transport_route_stops ( id, stop_name, landmark, pickup_time, stop_order )
      `)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const routes = (data || []).map(r => ({
      ...r,
      transport_route_stops: (r.transport_route_stops || []).sort(
        (a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order
      ),
    }));

    return NextResponse.json({ routes });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const body = await request.json();
    const name = (body.name || '').toString().trim();
    const fee_amount = Number(body.fee_amount || 0);
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const { data: route, error } = await supabaseAdmin
      .from('transport_routes')
      .insert({
        name,
        fee_amount,
        distance_km: body.distance_km || null,
        status: body.status || 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Route name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optional: insert stops if provided
    if (Array.isArray(body.stops) && body.stops.length) {
      const stops = body.stops.map((s: { stop_name: string; landmark?: string; pickup_time: string }, idx: number) => ({
        route_id: route.id,
        stop_name: s.stop_name,
        landmark: s.landmark || null,
        pickup_time: s.pickup_time,
        stop_order: idx + 1,
      }));
      await supabaseAdmin.from('transport_route_stops').insert(stops);
    }

    return NextResponse.json({ route }, { status: 201 });
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
    for (const k of ['name', 'distance_km', 'fee_amount', 'status']) {
      if (k in body) updates[k] = body[k];
    }

    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ route: data });
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
      .eq('route_id', id)
      .eq('status', 'active');

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `${count} active assignments on this route. Reassign first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('transport_routes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
