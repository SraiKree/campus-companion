import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EVENT_STATUSES } from '@/lib/sports';

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

// GET: list events (with sport info and student's registration status)
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sport_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('sport_events')
      .select('id, sport_id, name, description, event_date, event_time, venue, eligibility, registration_deadline, max_participants, status, winner, runner_up, third_place, results_notes, created_at, sports(name, category)')
      .order('event_date', { ascending: true });

    if (sportId) query = query.eq('sport_id', sportId);
    if (status && EVENT_STATUSES.includes(status as any)) query = query.eq('status', status);

    const { data: events, error } = await query;
    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Get student's registrations for these events
    const eventIds = (events || []).map((e: any) => e.id);
    let registrationMap: Record<string, { id: string; status: string }> = {};
    if (eventIds.length > 0) {
      const { data: regs } = await supabaseAdmin
        .from('sport_registrations')
        .select('id, event_id, status')
        .eq('student_id', user.id)
        .in('event_id', eventIds);
      (regs || []).forEach((r: any) => {
        registrationMap[r.event_id] = { id: r.id, status: r.status };
      });
    }

    // Get registration counts
    const countMap: Record<string, number> = {};
    if (eventIds.length > 0) {
      const { data: counts } = await supabaseAdmin
        .from('sport_registrations')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'Approved');
      (counts || []).forEach((c: any) => {
        countMap[c.event_id] = (countMap[c.event_id] || 0) + 1;
      });
    }

    const enriched = (events || []).map((e: any) => ({
      id: e.id,
      sport_id: e.sport_id,
      sport_name: e.sports?.name,
      sport_category: e.sports?.category,
      name: e.name,
      description: e.description,
      event_date: e.event_date,
      event_time: e.event_time,
      venue: e.venue,
      eligibility: e.eligibility,
      registration_deadline: e.registration_deadline,
      max_participants: e.max_participants,
      status: e.status,
      winner: e.winner,
      runner_up: e.runner_up,
      third_place: e.third_place,
      results_notes: e.results_notes,
      created_at: e.created_at,
      registration_count: countMap[e.id] || 0,
      my_registration: registrationMap[e.id] || null,
    }));

    return NextResponse.json({ events: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: register for an event
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const body = await request.json();
    const { event_id, notes } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    // Validate event is open
    const { data: event, error: evErr } = await supabaseAdmin
      .from('sport_events')
      .select('id, status, registration_deadline, max_participants')
      .eq('id', event_id)
      .single();

    if (evErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (event.status !== 'Upcoming') {
      return NextResponse.json({ error: 'Registrations are closed for this event' }, { status: 400 });
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    // Capacity check (approved only)
    if (event.max_participants) {
      const { count } = await supabaseAdmin
        .from('sport_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .eq('status', 'Approved');
      if ((count || 0) >= event.max_participants) {
        return NextResponse.json({ error: 'Event is at full capacity' }, { status: 400 });
      }
    }

    // Get student details
    const studentName = (user.user_metadata as any)?.name || user.email || 'Unknown';
    const studentRollNo = (user.user_metadata as any)?.roll_no || '';
    let studentDept = '';
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('department')
      .eq('id', user.id)
      .single();
    studentDept = profile?.department || '';

    const { data, error } = await supabaseAdmin
      .from('sport_registrations')
      .insert({
        event_id,
        student_id: user.id,
        student_name: studentName,
        student_roll_number: studentRollNo,
        student_department: studentDept,
        notes: notes?.trim() || null,
        status: 'Pending',
      })
      .select('id, event_id, status, registered_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You are already registered for this event' }, { status: 409 });
      }
      console.error('Registration error:', error);
      return NextResponse.json({ error: 'Failed to register', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ registration: data }, { status: 201 });
  } catch (err: any) {
    console.error('Sport register error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// DELETE: cancel registration (only if still pending)
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registration_id');
    if (!registrationId) {
      return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });
    }

    const { data: reg } = await supabaseAdmin
      .from('sport_registrations')
      .select('id, student_id, status')
      .eq('id', registrationId)
      .single();

    if (!reg || reg.student_id !== user.id) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    if (reg.status !== 'Pending') {
      return NextResponse.json({ error: 'Only pending registrations can be cancelled' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('sport_registrations')
      .delete()
      .eq('id', registrationId);

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
