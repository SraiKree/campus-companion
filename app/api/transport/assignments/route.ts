import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);

    const { searchParams } = new URL(request.url);
    const busId = searchParams.get('bus_id');
    const routeId = searchParams.get('route_id');
    const status = searchParams.get('status') || 'active';

    let query = supabaseAdmin
      .from('transport_assignments')
      .select(`
        id, student_roll, student_name, status, start_date, end_date,
        buses ( id, bus_number ),
        transport_routes ( id, name, fee_amount ),
        transport_route_stops ( id, stop_name, pickup_time )
      `)
      .order('student_roll');

    if (busId) query = query.eq('bus_id', busId);
    if (routeId) query = query.eq('route_id', routeId);
    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const body = await request.json();

    const student_roll = (body.student_roll || '').toString().trim().toUpperCase();
    const { route_id, bus_id, stop_id } = body;
    if (!student_roll || !route_id || !bus_id || !stop_id) {
      return NextResponse.json({ error: 'student_roll, route_id, bus_id, stop_id required' }, { status: 400 });
    }

    // Check student exists
    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name')
      .ilike('roll_number', student_roll)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: 'No student with that roll number' }, { status: 404 });

    // Prevent duplicate active assignment
    const { data: existing } = await supabaseAdmin
      .from('transport_assignments')
      .select('id')
      .eq('student_roll', student.roll_number)
      .eq('status', 'active')
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Student already has an active assignment. Transfer instead.' }, { status: 409 });
    }

    // Capacity check
    const { data: bus } = await supabaseAdmin
      .from('buses')
      .select('id, capacity, bus_number')
      .eq('id', bus_id)
      .single();
    if (!bus) return NextResponse.json({ error: 'Bus not found' }, { status: 404 });

    const { count } = await supabaseAdmin
      .from('transport_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('bus_id', bus_id)
      .eq('status', 'active');
    if ((count || 0) >= bus.capacity) {
      return NextResponse.json({ error: `Bus ${bus.bus_number} is full (${bus.capacity}/${bus.capacity}).` }, { status: 409 });
    }

    // Stop must belong to the route
    const { data: stop } = await supabaseAdmin
      .from('transport_route_stops')
      .select('id, route_id')
      .eq('id', stop_id)
      .single();
    if (!stop || stop.route_id !== route_id) {
      return NextResponse.json({ error: 'Selected stop is not on the selected route.' }, { status: 400 });
    }

    // Get route fee
    const { data: route } = await supabaseAdmin
      .from('transport_routes')
      .select('fee_amount')
      .eq('id', route_id)
      .single();

    // Create assignment + fee atomically-ish
    const { data: assignment, error } = await supabaseAdmin
      .from('transport_assignments')
      .insert({
        student_roll: student.roll_number,
        student_name: student.name,
        route_id, bus_id, stop_id,
        start_date: body.start_date || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (route?.fee_amount && Number(route.fee_amount) > 0) {
      const due = new Date(); due.setDate(due.getDate() + 30);
      await supabaseAdmin.from('transport_fees').insert({
        assignment_id: assignment.id,
        student_roll: student.roll_number,
        route_id,
        amount: route.fee_amount,
        due_date: due.toISOString().slice(0, 10),
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
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

    // Transfer: new bus / route / stop
    if (body.bus_id || body.route_id || body.stop_id) {
      const { data: current } = await supabaseAdmin
        .from('transport_assignments')
        .select('bus_id, route_id, stop_id')
        .eq('id', id)
        .single();
      if (!current) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

      const bus_id = body.bus_id || current.bus_id;
      const route_id = body.route_id || current.route_id;
      const stop_id = body.stop_id || current.stop_id;

      // Capacity check on new bus (only if bus changed)
      if (bus_id !== current.bus_id) {
        const { data: bus } = await supabaseAdmin.from('buses').select('capacity, bus_number').eq('id', bus_id).single();
        const { count } = await supabaseAdmin
          .from('transport_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('bus_id', bus_id)
          .eq('status', 'active');
        if (bus && (count || 0) >= bus.capacity) {
          return NextResponse.json({ error: `Bus ${bus.bus_number} is full.` }, { status: 409 });
        }
      }

      // Stop belongs to route check
      const { data: stop } = await supabaseAdmin.from('transport_route_stops').select('route_id').eq('id', stop_id).single();
      if (!stop || stop.route_id !== route_id) {
        return NextResponse.json({ error: 'Stop is not on the route.' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('transport_assignments')
        .update({ bus_id, route_id, stop_id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ assignment: data });
    }

    // Other updates (status, end_date)
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['status', 'end_date']) if (k in body) updates[k] = body[k];

    const { data, error } = await supabaseAdmin
      .from('transport_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignment: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
