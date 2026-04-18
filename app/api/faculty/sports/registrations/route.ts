import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { REGISTRATION_STATUSES } from '@/lib/sports';

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
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'faculty') throw { status: 403, message: 'Forbidden' };

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('sport_registrations')
      .select('id, event_id, student_id, student_name, student_roll_number, student_department, notes, status, registered_at, reviewed_at, sport_events(id, name, event_date, sports(name, category))')
      .order('registered_at', { ascending: false });

    if (eventId) query = query.eq('event_id', eventId);
    if (status && REGISTRATION_STATUSES.includes(status as any)) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    const registrations = (data || []).map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      student_id: r.student_id,
      student_name: r.student_name,
      student_roll_number: r.student_roll_number,
      student_department: r.student_department,
      notes: r.notes,
      status: r.status,
      registered_at: r.registered_at,
      reviewed_at: r.reviewed_at,
      event_name: r.sport_events?.name,
      event_date: r.sport_events?.event_date,
      sport_name: r.sport_events?.sports?.name,
      sport_category: r.sport_events?.sports?.category,
    }));

    return NextResponse.json({ registrations });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: approve or reject registration
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();
    const { id, status } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    if (!status || !REGISTRATION_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sport_registrations')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, reviewed_at')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update registration', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ registration: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
