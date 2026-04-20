import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClub } from '@/lib/club-auth';

export async function GET(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const { data, error } = await supabaseAdmin
      .from('club_events')
      .select('id, name, description, event_date, event_time, venue, eligibility, max_participants, registration_deadline, status, created_at')
      .eq('club_id', club.id)
      .order('event_date', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    return NextResponse.json({ events: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const body = await request.json();
    const name = (body?.name || '').toString().trim();
    const event_date = (body?.event_date || '').toString().trim();

    if (!name || !event_date) {
      return NextResponse.json({ error: 'name and event_date are required' }, { status: 400 });
    }

    const row: any = {
      club_id: club.id,
      name,
      event_date,
      description: body?.description?.toString().trim() || null,
      event_time: body?.event_time?.toString().trim() || null,
      venue: body?.venue?.toString().trim() || null,
      eligibility: body?.eligibility?.toString().trim() || null,
      max_participants: body?.max_participants != null ? Number(body.max_participants) || null : null,
      registration_deadline: body?.registration_deadline || null,
    };

    const { data, error } = await supabaseAdmin
      .from('club_events')
      .insert(row)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create event', details: error.message }, { status: 500 });
    return NextResponse.json({ event: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('club_events')
      .select('id, club_id')
      .eq('id', id)
      .single();

    if (!existing || existing.club_id !== club.id) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('club_events')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
