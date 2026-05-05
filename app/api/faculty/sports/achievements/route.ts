import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ACHIEVEMENT_POSITIONS } from '@/lib/sports';

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
  if (role !== 'faculty' && role !== 'sport_admin') throw { status: 403, message: 'Forbidden' };

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const sportId = searchParams.get('sport_id');

    let query = supabaseAdmin
      .from('sport_achievements')
      .select('id, student_id, event_id, sport_id, title, position, description, certificate_url, awarded_at, sports(name, category), sport_events(name, event_date)')
      .order('awarded_at', { ascending: false });

    if (eventId) query = query.eq('event_id', eventId);
    if (sportId) query = query.eq('sport_id', sportId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });

    // Enrich with student info
    const studentIds = Array.from(new Set((data || []).map((a: any) => a.student_id)));
    let nameMap: Record<string, { name: string; roll_no: string; department: string }> = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, roll_no, department')
        .in('id', studentIds);
      (profiles || []).forEach((p: any) => {
        nameMap[p.id] = { name: p.name || 'Student', roll_no: p.roll_no || '', department: p.department || '' };
      });
    }

    const achievements = (data || []).map((a: any) => ({
      id: a.id,
      student_id: a.student_id,
      student_name: nameMap[a.student_id]?.name || 'Student',
      student_roll_number: nameMap[a.student_id]?.roll_no || '',
      student_department: nameMap[a.student_id]?.department || '',
      event_id: a.event_id,
      sport_id: a.sport_id,
      title: a.title,
      position: a.position,
      description: a.description,
      certificate_url: a.certificate_url,
      awarded_at: a.awarded_at,
      sport_name: a.sports?.name,
      event_name: a.sport_events?.name,
      event_date: a.sport_events?.event_date,
    }));

    return NextResponse.json({ achievements });
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
      student_roll_number, event_id, sport_id,
      title, position, description, certificate_url,
    } = body;

    if (!student_roll_number?.trim()) {
      return NextResponse.json({ error: 'student_roll_number is required' }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (position && !ACHIEVEMENT_POSITIONS.includes(position)) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, roll_no')
      .eq('roll_no', student_roll_number.trim())
      .single();

    if (!profile?.id) {
      return NextResponse.json({ error: 'Student not found (must have logged in at least once)' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('sport_achievements')
      .insert({
        student_id: profile.id,
        event_id: event_id || null,
        sport_id: sport_id || null,
        title: title.trim(),
        position: position || null,
        description: description?.trim() || null,
        certificate_url: certificate_url?.trim() || null,
        awarded_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create achievement', details: error.message }, { status: 500 });

    return NextResponse.json({ achievement: data }, { status: 201 });
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

    const { error } = await supabaseAdmin.from('sport_achievements').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete achievement', details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
