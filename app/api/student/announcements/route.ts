import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ANNOUNCEMENT_CLUBS } from '@/lib/announcements';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function authenticateStudent(request: NextRequest) {
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

  const { data: roleData } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();

  if (role !== 'student') {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);

    const clubFilter = request.nextUrl.searchParams.get('club');
    let query = supabaseAdmin
      .from('announcements')
      .select('id, faculty_id, club_name, subject, description, link, image_url, created_at')
      .order('created_at', { ascending: false });

    if (clubFilter && ANNOUNCEMENT_CLUBS.includes(clubFilter as any)) {
      query = query.eq('club_name', clubFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Student announcements GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    const facultyIds = Array.from(new Set((data || []).map((item) => item.faculty_id).filter(Boolean)));
    let profiles: Array<{ id: string; name: string | null }> = [];

    if (facultyIds.length) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', facultyIds);

      profiles = profileData || [];
    }

    const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile.name]));
    const announcements = (data || []).map((item) => ({
      ...item,
      faculty_name: profileMap.get(item.faculty_id) || 'Faculty',
    }));

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Student announcements auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
