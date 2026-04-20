import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClub } from '@/lib/club-auth';

export async function GET(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const { data, error } = await supabaseAdmin
      .from('club_announcements')
      .select('id, title, body, is_active, created_at')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    return NextResponse.json({ announcements: data || [] });
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
    const title = (body?.title || '').toString().trim();
    const text = (body?.body || '').toString().trim();

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('club_announcements')
      .insert({ club_id: club.id, title, body: text || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    return NextResponse.json({ announcement: data }, { status: 201 });
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
      .from('club_announcements')
      .select('id, club_id')
      .eq('id', id)
      .single();

    if (!existing || existing.club_id !== club.id) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('club_announcements')
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
