import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ANNOUNCEMENT_CLUBS } from '@/lib/announcements';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function authenticateFaculty(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const { data: roleRows } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const metadata = user.user_metadata as Record<string, unknown> | null;
  const roleFromMetadata = metadata && typeof metadata.role === 'string' ? metadata.role : null;
  const roles = (roleRows ?? []).map((r: { role: string | null }) =>
    String(r?.role ?? '').toLowerCase()
  );
  if (roleFromMetadata) roles.push(roleFromMetadata.toLowerCase());

  if (!roles.includes('faculty')) {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

function errorResponse(error: unknown) {
  const e = error as { status?: number; message?: string } | null;
  return NextResponse.json(
    { error: e?.message ?? 'Internal server error' },
    { status: e?.status ?? 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('id, faculty_id, club_name, subject, description, link, image_url, created_at')
      .eq('faculty_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Faculty announcements GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    return NextResponse.json({ announcements: data ?? [] });
  } catch (error) {
    console.error('Faculty announcements error:', error);
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    const body = await request.json().catch(() => ({}));
    const { club_name, subject, description, link, image_url } = body || {};

    if (!club_name || !ANNOUNCEMENT_CLUBS.includes(club_name)) {
      return NextResponse.json({ error: 'Invalid club_name' }, { status: 400 });
    }
    if (typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        faculty_id: user.id,
        club_name,
        subject: subject.trim(),
        description: description?.trim() || null,
        link: link?.trim() || null,
        image_url: image_url?.trim() || null,
      })
      .select('id, faculty_id, club_name, subject, description, link, image_url, created_at')
      .single();

    if (error) {
      console.error('Faculty announcements POST error:', error);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    return NextResponse.json({ announcement: data });
  } catch (error) {
    console.error('Faculty announcements error:', error);
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('announcements')
      .select('id, faculty_id')
      .eq('id', id)
      .single();

    if (lookupError || !existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    if (existing.faculty_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Faculty announcements DELETE error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Faculty announcements error:', error);
    return errorResponse(error);
  }
}
