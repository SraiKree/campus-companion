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
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'student') throw { status: 403, message: 'Forbidden' };

  return { user };
}

// GET: list courts + bookings for a given court+date (to show availability)
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('court_id');
    const date = searchParams.get('date');
    const mine = searchParams.get('mine');

    // My bookings shortcut
    if (mine === 'true') {
      const { data, error } = await supabaseAdmin
        .from('court_bookings')
        .select('id, court_id, booking_date, start_time, end_time, purpose, status, created_at, sport_courts(name, location, sports(name, category))')
        .eq('student_id', user.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (error) return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });

      const bookings = (data || []).map((b: any) => ({
        id: b.id,
        court_id: b.court_id,
        court_name: b.sport_courts?.name,
        sport_name: b.sport_courts?.sports?.name,
        location: b.sport_courts?.location,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        purpose: b.purpose,
        status: b.status,
        created_at: b.created_at,
      }));

      return NextResponse.json({ bookings });
    }

    // Availability for a specific court + date
    if (courtId && date) {
      const { data, error } = await supabaseAdmin
        .from('court_bookings')
        .select('id, start_time, end_time, status, student_name')
        .eq('court_id', courtId)
        .eq('booking_date', date)
        .in('status', ['Pending', 'Confirmed'])
        .order('start_time', { ascending: true });

      if (error) return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
      return NextResponse.json({ slots: data || [] });
    }

    // Default: list active courts
    const { data, error } = await supabaseAdmin
      .from('sport_courts')
      .select('id, sport_id, name, location, capacity, description, opens_at, closes_at, slot_minutes, is_active, created_at, sports(name, category)')
      .eq('is_active', true)
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

// POST: book a court slot
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const body = await request.json();
    const { court_id, booking_date, start_time, end_time, purpose } = body;

    if (!court_id || !booking_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'court_id, booking_date, start_time, end_time are required' }, { status: 400 });
    }
    if (end_time <= start_time) {
      return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 });
    }

    // Don't allow booking in the past
    const slotStart = new Date(`${booking_date}T${start_time}`);
    if (slotStart < new Date()) {
      return NextResponse.json({ error: 'Cannot book a slot in the past' }, { status: 400 });
    }

    // Validate court + operating hours
    const { data: court, error: courtErr } = await supabaseAdmin
      .from('sport_courts')
      .select('id, is_active, opens_at, closes_at')
      .eq('id', court_id)
      .single();

    if (courtErr || !court || !court.is_active) {
      return NextResponse.json({ error: 'Court not available' }, { status: 404 });
    }
    if (start_time < court.opens_at || end_time > court.closes_at) {
      return NextResponse.json({ error: `Court is open ${court.opens_at} – ${court.closes_at}` }, { status: 400 });
    }

    // Overlap check (any existing active booking on the same court+date whose range overlaps)
    const { data: overlaps } = await supabaseAdmin
      .from('court_bookings')
      .select('id, start_time, end_time')
      .eq('court_id', court_id)
      .eq('booking_date', booking_date)
      .in('status', ['Pending', 'Confirmed'])
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (overlaps && overlaps.length > 0) {
      return NextResponse.json({ error: 'That time slot overlaps with an existing booking' }, { status: 409 });
    }

    // Enrich student info
    const studentName = (user.user_metadata as any)?.name || user.email || 'Unknown';
    const studentRollNo = (user.user_metadata as any)?.roll_no || '';
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('department').eq('id', user.id).single();

    const { data, error } = await supabaseAdmin
      .from('court_bookings')
      .insert({
        court_id,
        student_id: user.id,
        student_name: studentName,
        student_roll_number: studentRollNo,
        student_department: profile?.department || '',
        booking_date,
        start_time,
        end_time,
        purpose: purpose?.trim() || null,
        status: 'Confirmed',
      })
      .select()
      .single();

    if (error) {
      console.error('Booking error:', error);
      return NextResponse.json({ error: 'Failed to book', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// DELETE: cancel my booking
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: booking } = await supabaseAdmin
      .from('court_bookings')
      .select('id, student_id, status')
      .eq('id', id)
      .single();

    if (!booking || booking.student_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
      return NextResponse.json({ error: 'Booking already closed' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('court_bookings')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
