import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    const { data, error } = await supabaseAdmin
      .from('faculty_events_attended')
      .select('*')
      .eq('faculty_id', user.id)
      .order('date_from', { ascending: false, nullsFirst: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();

    if (!body.event_name) {
      return NextResponse.json({ error: 'event_name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('faculty_events_attended')
      .insert([{
        faculty_id: user.id,
        event_name: body.event_name,
        event_type: body.event_type || 'workshop',
        organizer: body.organizer || null,
        location: body.location || null,
        date_from: body.date_from || null,
        date_to: body.date_to || null,
        certificate_url: body.certificate_url || null,
        notes: body.notes || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('faculty_events_attended')
      .delete()
      .eq('id', id)
      .eq('faculty_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
