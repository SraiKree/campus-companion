import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    let query = supabaseAdmin
      .from('sport_teams')
      .select('id, sport_id, name, captain_name, description, created_at, sports(name, category), sport_team_members(id, student_id, student_name, student_roll_number, position, joined_at)')
      .order('created_at', { ascending: false });

    if (sportId) query = query.eq('sport_id', sportId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });

    const teams = (data || []).map((t: any) => ({
      id: t.id,
      sport_id: t.sport_id,
      sport_name: t.sports?.name,
      sport_category: t.sports?.category,
      name: t.name,
      captain_name: t.captain_name,
      description: t.description,
      created_at: t.created_at,
      members: t.sport_team_members || [],
    }));

    return NextResponse.json({ teams });
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
    const { sport_id, name, captain_name, description } = body;

    if (!sport_id) return NextResponse.json({ error: 'sport_id is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('sport_teams')
      .insert({
        sport_id,
        name: name.trim(),
        captain_name: captain_name?.trim() || null,
        description: description?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create team', details: error.message }, { status: 500 });

    return NextResponse.json({ team: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: add a member to a team
// body: { team_id, student_roll_number, position? }
export async function PATCH(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const body = await request.json();
    const { team_id, student_roll_number, position, action } = body;

    if (!team_id) return NextResponse.json({ error: 'team_id is required' }, { status: 400 });

    // action === 'remove' will remove a member_id from the team
    if (action === 'remove') {
      const { member_id } = body;
      if (!member_id) return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
      const { error } = await supabaseAdmin.from('sport_team_members').delete().eq('id', member_id);
      if (error) return NextResponse.json({ error: 'Failed to remove member', details: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Default: add a member
    if (!student_roll_number?.trim()) {
      return NextResponse.json({ error: 'student_roll_number is required' }, { status: 400 });
    }

    // Look up student by roll number
    const roll = student_roll_number.trim();
    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name')
      .eq('roll_number', roll)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found with that roll number' }, { status: 404 });
    }

    // Look up auth user id from profiles by roll number
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('roll_no', roll)
      .single();

    if (!profile?.id) {
      return NextResponse.json({ error: 'Student has not signed in yet — ask them to log in once.' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('sport_team_members')
      .insert({
        team_id,
        student_id: profile.id,
        student_name: student.name,
        student_roll_number: student.roll_number,
        position: position?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Student is already on this team' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to add member', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data }, { status: 201 });
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

    const { error } = await supabaseAdmin.from('sport_teams').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete team', details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
