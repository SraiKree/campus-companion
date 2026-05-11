import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { BOOKING_STATUSES } from '@/lib/sports';

async function authenticateFaculty(request: NextRequest) {
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
  if (!roles.includes('faculty') && !roles.includes('sport_admin')) throw { status: 403, message: 'Forbidden' };

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const includeBookings = searchParams.get('bookings') === 'true';
    const bookingStatus = searchParams.get('status');
    const date = searchParams.get('date');

    if (includeBookings) {
      let q = supabaseAdmin
        .from('court_bookings')
        .select('id, court_id, student_id, student_name, student_roll_number, student_department, booking_date, start_time, end_time, purpose, status, created_at, sport_courts(name, location, sports(name, category))')
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (bookingStatus && BOOKING_STATUSES.includes(bookingStatus as any)) q = q.eq('status', bookingStatus);
      if (date) q = q.eq('booking_date', date);

      const { data, error } = await q;
      if (error) return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });

      const bookings = (data || []).map((b: any) => ({
        id: b.id,
        court_id: b.court_id,
        court_name: b.sport_courts?.name,
        location: b.sport_courts?.location,
        sport_name: b.sport_courts?.sports?.name,
        student_id: b.student_id,
        student_name: b.student_name,
        student_roll_number: b.student_roll_number,
        student_department: b.student_department,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        purpose: b.purpose,
        status: b.status,
        created_at: b.created_at,
      }));
      return NextResponse.json({ bookings });
    }

    const { data, error } = await supabaseAdmin
      .from('sport_courts')
      .select('id, sport_id, name, location, capacity, description, opens_at, closes_at, slot_minutes, is_active, created_at, sports(name, category)')
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });

    const courts = (data || []).map((c: any) => ({
      id: c.id,
      sport_id: c.sport_id,
      sport_name: c.sports?.name,
      sport_category: c.sports?.category,
      name: c.name,
      location: c.location,
      capacity: c.capacity,
      description: c.description,
      opens_at: c.opens_at,
      closes_at: c.closes_at,
      slot_minutes: c.slot_minutes,
      is_active: c.is_active,
      created_at: c.created_at,
    }));

    return NextResponse.json({ courts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();
    const {
      sport_id, name, location, capacity, description,
      opens_at, closes_at, slot_minutes,
    } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('sport_courts')
      .insert({
        sport_id: sport_id || null,
        name: name.trim(),
        location: location?.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        description: description?.trim() || null,
        opens_at: opens_at || '06:00:00',
        closes_at: closes_at || '21:00:00',
        slot_minutes: slot_minutes ? Number(slot_minutes) : 60,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create court', details: error.message }, { status: 500 });

    return NextResponse.json({ court: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: update court OR update a booking status (when body.booking_id present)
export async function PATCH(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const body = await request.json();

    if (body.booking_id) {
      const { booking_id, status } = body;
      if (!status || !BOOKING_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from('court_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', booking_id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
      return NextResponse.json({ booking: data });
    }

    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const allowed = ['sport_id', 'name', 'location', 'capacity', 'description', 'opens_at', 'closes_at', 'slot_minutes', 'is_active'];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in updates) payload[k] = updates[k];

    const { data, error } = await supabaseAdmin
      .from('sport_courts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update court', details: error.message }, { status: 500 });

    return NextResponse.json({ court: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('sport_courts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete court', details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
