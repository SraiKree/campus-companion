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

// GET: student's registrations, team memberships, and achievements
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const [regsRes, achievementsRes, teamsRes] = await Promise.all([
      supabaseAdmin
        .from('sport_registrations')
        .select('id, event_id, status, notes, registered_at, reviewed_at, sport_events(id, name, event_date, event_time, venue, status, sports(name, category))')
        .eq('student_id', user.id)
        .order('registered_at', { ascending: false }),
      supabaseAdmin
        .from('sport_achievements')
        .select('id, title, position, description, certificate_url, awarded_at, event_id, sport_id, sports(name, category), sport_events(name, event_date)')
        .eq('student_id', user.id)
        .order('awarded_at', { ascending: false }),
      supabaseAdmin
        .from('sport_team_members')
        .select('id, team_id, position, joined_at, sport_teams(id, name, sport_id, captain_name, sports(name, category))')
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false }),
    ]);

    if (regsRes.error) console.error('Regs fetch error:', regsRes.error);
    if (achievementsRes.error) console.error('Achievements fetch error:', achievementsRes.error);
    if (teamsRes.error) console.error('Teams fetch error:', teamsRes.error);

    const registrations = (regsRes.data || []).map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      status: r.status,
      notes: r.notes,
      registered_at: r.registered_at,
      reviewed_at: r.reviewed_at,
      event: r.sport_events
        ? {
            id: r.sport_events.id,
            name: r.sport_events.name,
            event_date: r.sport_events.event_date,
            event_time: r.sport_events.event_time,
            venue: r.sport_events.venue,
            status: r.sport_events.status,
            sport_name: r.sport_events.sports?.name,
            sport_category: r.sport_events.sports?.category,
          }
        : null,
    }));

    const achievements = (achievementsRes.data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      position: a.position,
      description: a.description,
      certificate_url: a.certificate_url,
      awarded_at: a.awarded_at,
      event_id: a.event_id,
      sport_id: a.sport_id,
      sport_name: a.sports?.name,
      event_name: a.sport_events?.name,
      event_date: a.sport_events?.event_date,
    }));

    const teams = (teamsRes.data || []).map((t: any) => ({
      id: t.id,
      team_id: t.team_id,
      position: t.position,
      joined_at: t.joined_at,
      team_name: t.sport_teams?.name,
      captain_name: t.sport_teams?.captain_name,
      sport_name: t.sport_teams?.sports?.name,
      sport_category: t.sport_teams?.sports?.category,
    }));

    return NextResponse.json({ registrations, achievements, teams });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
