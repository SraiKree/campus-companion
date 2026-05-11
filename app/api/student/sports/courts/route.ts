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
        .select('id, court_id, booking_date, start_time, end_time, purpose, status, created_at, sport_courts(name, location, max_players, sports(name, category)), court_booking_players(id, booking_id, roll_number, player_name, added_at), booking_equipment(id, booking_id, equipment_id, quantity, created_at, sport_equipment(name))')
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
        max_players: b.sport_courts?.max_players,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        purpose: b.purpose,
        status: b.status,
        created_at: b.created_at,
        players: b.court_booking_players || [],
        equipment: (b.booking_equipment || []).map((e: any) => ({
          id: e.id,
          booking_id: e.booking_id,
          equipment_id: e.equipment_id,
          equipment_name: e.sport_equipment?.name,
          quantity: e.quantity,
          created_at: e.created_at,
        })),
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
      .select('id, sport_id, name, location, capacity, max_players, description, opens_at, closes_at, slot_minutes, is_active, created_at, sports(name, category)')
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
      max_players: c.max_players,
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
    const rawPlayers: Array<{ roll_no?: string; name?: string }> = Array.isArray(body.players) ? body.players : [];
    const rawEquipment: Array<{ equipment_id?: string; quantity?: number }> = Array.isArray(body.equipment) ? body.equipment : [];

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

    // Validate court + operating hours + player cap
    const { data: court, error: courtErr } = await supabaseAdmin
      .from('sport_courts')
      .select('id, is_active, opens_at, closes_at, max_players')
      .eq('id', court_id)
      .single();

    if (courtErr || !court || !court.is_active) {
      return NextResponse.json({ error: 'Court not available' }, { status: 404 });
    }
    if (start_time < court.opens_at || end_time > court.closes_at) {
      return NextResponse.json({ error: `Court is open ${court.opens_at} – ${court.closes_at}` }, { status: 400 });
    }

    // Normalize players: trim, uppercase, dedupe, drop booker's own roll
    const bookerRoll = ((user.user_metadata as any)?.roll_no || '').toString().trim().toUpperCase();
    const players: Array<{ roll_number: string; player_name: string | null }> = [];
    const seen = new Set<string>();
    for (const p of rawPlayers) {
      const roll = (p?.roll_no || '').toString().trim().toUpperCase();
      if (!roll || roll === bookerRoll || seen.has(roll)) continue;
      seen.add(roll);
      const name = (p?.name || '').toString().trim();
      players.push({ roll_number: roll, player_name: name || null });
    }
    if (players.length + 1 > court.max_players) {
      return NextResponse.json({ error: `This facility allows up to ${court.max_players} players (including you)` }, { status: 400 });
    }

    // Normalize equipment + validate availability against overlapping bookings
    const equipmentReq: Array<{ equipment_id: string; quantity: number }> = [];
    const seenEq = new Set<string>();
    for (const e of rawEquipment) {
      const id = (e?.equipment_id || '').toString().trim();
      const qty = Number(e?.quantity) || 0;
      if (!id || qty <= 0 || seenEq.has(id)) continue;
      seenEq.add(id);
      equipmentReq.push({ equipment_id: id, quantity: qty });
    }

    if (equipmentReq.length > 0) {
      const ids = equipmentReq.map((e) => e.equipment_id);
      const { data: eqItems } = await supabaseAdmin
        .from('sport_equipment')
        .select('id, name, total_quantity, is_active')
        .in('id', ids);

      const eqMap = new Map<string, { name: string; total: number }>();
      for (const it of eqItems || []) {
        if (!it.is_active) {
          return NextResponse.json({ error: `Equipment "${it.name}" is not available` }, { status: 400 });
        }
        eqMap.set(it.id, { name: it.name, total: it.total_quantity });
      }
      for (const req of equipmentReq) {
        if (!eqMap.has(req.equipment_id)) {
          return NextResponse.json({ error: 'Unknown equipment in request' }, { status: 400 });
        }
      }

      const { data: overlapRows } = await supabaseAdmin
        .from('booking_equipment')
        .select('equipment_id, quantity, court_bookings!inner(booking_date, start_time, end_time, status)')
        .in('equipment_id', ids)
        .eq('court_bookings.booking_date', booking_date)
        .in('court_bookings.status', ['Pending', 'Confirmed'])
        .lt('court_bookings.start_time', end_time)
        .gt('court_bookings.end_time', start_time);

      const reserved = new Map<string, number>();
      for (const row of overlapRows || []) {
        reserved.set(row.equipment_id, (reserved.get(row.equipment_id) || 0) + (row.quantity || 0));
      }
      for (const req of equipmentReq) {
        const info = eqMap.get(req.equipment_id)!;
        const left = info.total - (reserved.get(req.equipment_id) || 0);
        if (req.quantity > left) {
          return NextResponse.json(
            { error: `Only ${left} × ${info.name} available for this slot` },
            { status: 400 }
          );
        }
      }
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

    let insertedPlayers: any[] = [];
    if (players.length > 0) {
      const rows = players.map(p => ({ booking_id: data.id, roll_number: p.roll_number, player_name: p.player_name }));
      const { data: playerData, error: playerErr } = await supabaseAdmin
        .from('court_booking_players')
        .insert(rows)
        .select();

      if (playerErr) {
        await supabaseAdmin.from('court_bookings').delete().eq('id', data.id);
        console.error('Player insert error:', playerErr);
        return NextResponse.json({ error: 'Failed to save players', details: playerErr.message }, { status: 500 });
      }
      insertedPlayers = playerData || [];
    }

    let insertedEquipment: any[] = [];
    if (equipmentReq.length > 0) {
      const rows = equipmentReq.map((e) => ({ booking_id: data.id, equipment_id: e.equipment_id, quantity: e.quantity }));
      const { data: eqData, error: eqErr } = await supabaseAdmin
        .from('booking_equipment')
        .insert(rows)
        .select();

      if (eqErr) {
        await supabaseAdmin.from('court_bookings').delete().eq('id', data.id);
        console.error('Equipment insert error:', eqErr);
        return NextResponse.json({ error: 'Failed to reserve equipment', details: eqErr.message }, { status: 500 });
      }
      insertedEquipment = eqData || [];
    }

    return NextResponse.json({
      booking: { ...data, players: insertedPlayers, equipment: insertedEquipment },
    }, { status: 201 });
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
