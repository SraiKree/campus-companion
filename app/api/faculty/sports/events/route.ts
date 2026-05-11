import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EVENT_STATUSES } from '@/lib/sports';

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
    const sportId = searchParams.get('sport_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('sport_events')
      .select('id, sport_id, name, description, event_date, event_time, venue, eligibility, registration_deadline, max_participants, status, winner, runner_up, third_place, results_notes, created_at, updated_at, sports(name, category)')
      .order('event_date', { ascending: false });

    if (sportId) query = query.eq('sport_id', sportId);
    if (status && EVENT_STATUSES.includes(status as any)) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    const eventIds = (data || []).map((e: any) => e.id);
    const countMap: Record<string, { total: number; pending: number; approved: number }> = {};
    if (eventIds.length > 0) {
      const { data: regs } = await supabaseAdmin
        .from('sport_registrations')
        .select('event_id, status')
        .in('event_id', eventIds);
      (regs || []).forEach((r: any) => {
        if (!countMap[r.event_id]) countMap[r.event_id] = { total: 0, pending: 0, approved: 0 };
        countMap[r.event_id].total += 1;
        if (r.status === 'Pending') countMap[r.event_id].pending += 1;
        if (r.status === 'Approved') countMap[r.event_id].approved += 1;
      });
    }

    const events = (data || []).map((e: any) => ({
      ...e,
      sport_name: e.sports?.name,
      sport_category: e.sports?.category,
      registration_count: countMap[e.id]?.approved || 0,
      pending_count: countMap[e.id]?.pending || 0,
      total_registrations: countMap[e.id]?.total || 0,
    }));

    return NextResponse.json({ events });
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
      sport_id, name, description, event_date, event_time,
      venue, eligibility, registration_deadline, max_participants, status,
    } = body;

    if (!sport_id) return NextResponse.json({ error: 'sport_id is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!event_date) return NextResponse.json({ error: 'event_date is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('sport_events')
      .insert({
        sport_id,
        name: name.trim(),
        description: description?.trim() || null,
        event_date,
        event_time: event_time || null,
        venue: venue?.trim() || null,
        eligibility: eligibility?.trim() || null,
        registration_deadline: registration_deadline || null,
        max_participants: max_participants ? Number(max_participants) : null,
        status: (status && EVENT_STATUSES.includes(status)) ? status : 'Upcoming',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create event', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (updates.status && !EVENT_STATUSES.includes(updates.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const allowed = [
      'sport_id', 'name', 'description', 'event_date', 'event_time',
      'venue', 'eligibility', 'registration_deadline', 'max_participants',
      'status', 'winner', 'runner_up', 'third_place', 'results_notes',
    ];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) {
      if (k in updates) payload[k] = updates[k];
    }

    const { data, error } = await supabaseAdmin
      .from('sport_events')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update event', details: error.message }, { status: 500 });

    return NextResponse.json({ event: data });
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

    const { error } = await supabaseAdmin.from('sport_events').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete event', details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
