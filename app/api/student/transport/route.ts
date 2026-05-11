import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function authenticateStudent(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  if (!token) throw { status: 401, message: 'Unauthorized' };

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw { status: 401, message: 'Unauthorized' };

  const metaRole = (user.user_metadata as Record<string, unknown> | undefined)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id);
  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (metaRole) roles.push(String(metaRole).toLowerCase());
  if (!roles.includes('student')) throw { status: 403, message: 'Forbidden' };

  const rollRaw =
    (user.user_metadata as Record<string, unknown> | undefined)?.roll_no ||
    (user.user_metadata as Record<string, unknown> | undefined)?.roll_number ||
    '';
  const roll = rollRaw.toString().trim().toUpperCase();

  return { user, roll };
}

export async function GET(request: NextRequest) {
  try {
    const { roll } = await authenticateStudent(request);

    const [busesRes, routesRes, assignCountsRes] = await Promise.all([
      supabaseAdmin
        .from('buses')
        .select(`
          id, bus_number, capacity, status, notes, route_id, driver_id,
          transport_routes ( id, name, fee_amount, distance_km ),
          transport_drivers ( id, full_name, phone )
        `)
        .order('bus_number'),
      supabaseAdmin
        .from('transport_routes')
        .select(`
          id, name, fee_amount, distance_km, status,
          transport_route_stops ( id, stop_name, landmark, pickup_time, stop_order )
        `)
        .order('name'),
      supabaseAdmin
        .from('transport_assignments')
        .select('bus_id')
        .eq('status', 'active'),
    ]);

    if (busesRes.error) return NextResponse.json({ error: busesRes.error.message }, { status: 500 });
    if (routesRes.error) return NextResponse.json({ error: routesRes.error.message }, { status: 500 });

    const counts: Record<string, number> = {};
    (assignCountsRes.data || []).forEach(a => {
      counts[a.bus_id] = (counts[a.bus_id] || 0) + 1;
    });

    const fleet = (busesRes.data || []).map(b => ({
      ...b,
      assigned_count: counts[b.id] || 0,
      seats_remaining: Math.max(b.capacity - (counts[b.id] || 0), 0),
    }));

    const routes = (routesRes.data || []).map(r => ({
      ...r,
      transport_route_stops: (r.transport_route_stops || []).sort(
        (a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order
      ),
    }));

    let myAssignment: unknown = null;
    let myFees: unknown[] = [];
    if (roll) {
      const { data: assignment } = await supabaseAdmin
        .from('transport_assignments')
        .select(`
          id, student_roll, student_name, status, start_date, end_date,
          buses ( id, bus_number, capacity, status, notes,
            transport_drivers ( id, full_name, phone )
          ),
          transport_routes ( id, name, fee_amount, distance_km ),
          transport_route_stops ( id, stop_name, landmark, pickup_time, stop_order )
        `)
        .eq('student_roll', roll)
        .eq('status', 'active')
        .maybeSingle();

      myAssignment = assignment || null;

      const { data: fees } = await supabaseAdmin
        .from('transport_fees')
        .select('id, amount, due_date, paid_date, status, payment_ref, created_at')
        .eq('student_roll', roll)
        .order('due_date', { ascending: false });

      myFees = fees || [];
    }

    return NextResponse.json({
      fleet,
      routes,
      myAssignment,
      myFees,
      roll,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e?.message ?? 'Internal server error' },
      { status: e?.status ?? 500 }
    );
  }
}
