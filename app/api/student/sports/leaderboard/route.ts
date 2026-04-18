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

// Points per achievement position
const POSITION_POINTS: Record<string, number> = {
  Winner: 10,
  'Runner-up': 7,
  'Third Place': 5,
  'Special Mention': 3,
  Participant: 1,
};

export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('sport_achievements')
      .select('student_id, position');

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ error: 'Failed to compute leaderboard' }, { status: 500 });
    }

    // Aggregate by student
    const tally: Record<string, { student_id: string; points: number; wins: number; achievements: number }> = {};
    for (const row of data || []) {
      const id = row.student_id;
      if (!tally[id]) tally[id] = { student_id: id, points: 0, wins: 0, achievements: 0 };
      tally[id].points += POSITION_POINTS[row.position as string] || 0;
      tally[id].achievements += 1;
      if (row.position === 'Winner') tally[id].wins += 1;
    }

    const ranked = Object.values(tally).sort((a, b) => b.points - a.points).slice(0, 25);

    // Enrich with student names
    const studentIds = ranked.map((r) => r.student_id);
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

    const leaderboard = ranked.map((r, i) => ({
      rank: i + 1,
      student_id: r.student_id,
      student_name: nameMap[r.student_id]?.name || 'Student',
      roll_no: nameMap[r.student_id]?.roll_no || '',
      department: nameMap[r.student_id]?.department || '',
      points: r.points,
      wins: r.wins,
      achievements: r.achievements,
    }));

    return NextResponse.json({ leaderboard });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
