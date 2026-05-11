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

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) throw { status: 403, message: 'Forbidden' };

  return { user };
}

// GET /api/student/sports/equipment?sport_id=...&date=YYYY-MM-DD&start=HH:MM&end=HH:MM
// Returns equipment for a sport plus available_quantity for the optional slot window.
export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);
    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sport_id');
    const date = searchParams.get('date');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!sportId) return NextResponse.json({ error: 'sport_id is required' }, { status: 400 });

    const { data: items, error } = await supabaseAdmin
      .from('sport_equipment')
      .select('id, sport_id, name, description, total_quantity, is_active, created_at')
      .eq('sport_id', sportId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });

    if (!date || !start || !end || !items || items.length === 0) {
      return NextResponse.json({
        equipment: (items || []).map((i) => ({ ...i, available_quantity: i.total_quantity })),
      });
    }

    // Compute per-slot availability: subtract quantities reserved by overlapping active bookings
    const { data: overlap } = await supabaseAdmin
      .from('booking_equipment')
      .select('equipment_id, quantity, court_bookings!inner(booking_date, start_time, end_time, status)')
      .in('equipment_id', items.map((i) => i.id))
      .eq('court_bookings.booking_date', date)
      .in('court_bookings.status', ['Pending', 'Confirmed'])
      .lt('court_bookings.start_time', end)
      .gt('court_bookings.end_time', start);

    const reserved = new Map<string, number>();
    for (const row of overlap || []) {
      reserved.set(row.equipment_id, (reserved.get(row.equipment_id) || 0) + (row.quantity || 0));
    }

    const equipment = items.map((i) => ({
      ...i,
      available_quantity: Math.max(0, i.total_quantity - (reserved.get(i.id) || 0)),
    }));

    return NextResponse.json({ equipment });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
