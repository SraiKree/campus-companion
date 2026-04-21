import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);

    const { data, error } = await supabaseAdmin
      .from('buses')
      .select(`
        id, bus_number, capacity, status, notes, route_id, driver_id,
        transport_routes ( id, name ),
        transport_drivers ( id, full_name, phone )
      `)
      .order('bus_number');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Seats remaining from assignments
    const { data: assignCounts } = await supabaseAdmin
      .from('transport_assignments')
      .select('bus_id')
      .eq('status', 'active');

    const counts: Record<string, number> = {};
    (assignCounts || []).forEach(a => {
      counts[a.bus_id] = (counts[a.bus_id] || 0) + 1;
    });

    const buses = (data || []).map(b => ({
      ...b,
      assigned_count: counts[b.id] || 0,
      seats_remaining: b.capacity - (counts[b.id] || 0),
    }));

    return NextResponse.json({ buses });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const body = await request.json();

    const bus_number = (body.bus_number || '').toString().trim();
    const capacity = Number(body.capacity);
    if (!bus_number || !capacity || capacity <= 0) {
      return NextResponse.json({ error: 'bus_number and positive capacity are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('buses')
      .insert({
        bus_number,
        capacity,
        route_id: body.route_id || null,
        driver_id: body.driver_id || null,
        status: body.status || 'active',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bus number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ bus: data }, { status: 201 });
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
    for (const k of ['bus_number', 'capacity', 'route_id', 'driver_id', 'status', 'notes']) {
      if (k in body) updates[k] = body[k];
    }

    // Capacity reduction check
    if (typeof updates.capacity === 'number') {
      const { count } = await supabaseAdmin
        .from('transport_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('bus_id', id)
        .eq('status', 'active');
      if ((count || 0) > (updates.capacity as number)) {
        return NextResponse.json(
          { error: `Capacity ${updates.capacity} < current assigned students (${count}). Reassign first.` },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('buses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bus: data });
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

    // Block if active assignments exist
    const { count } = await supabaseAdmin
      .from('transport_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('bus_id', id)
      .eq('status', 'active');

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `${count} students are still assigned to this bus. Reassign them first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('buses').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
