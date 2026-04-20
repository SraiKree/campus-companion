import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClub } from '@/lib/club-auth';

export async function GET(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);

    const [membersRes, eventsRes, annRes] = await Promise.all([
      supabaseAdmin.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', club.id),
      supabaseAdmin.from('club_events').select('id', { count: 'exact', head: true }).eq('club_id', club.id),
      supabaseAdmin.from('club_announcements').select('id', { count: 'exact', head: true }).eq('club_id', club.id).eq('is_active', true),
    ]);

    return NextResponse.json({
      club,
      counts: {
        members: membersRes.count ?? 0,
        events: eventsRes.count ?? 0,
        announcements: annRes.count ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
