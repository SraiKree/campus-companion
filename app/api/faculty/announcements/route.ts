import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ANNOUNCEMENT_CLUBS } from '@/lib/announcements';
import { supabaseAdmin } from '@/lib/supabase-admin';

const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  const { data: roleData } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();

  if (role !== 'faculty') {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

async function attachFacultyNames(items: any[]) {
  const facultyIds = Array.from(new Set(items.map((item) => item.faculty_id).filter(Boolean)));
  if (facultyIds.length === 0) {
    return items;
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, name')
    .in('id', facultyIds);

  const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile.name]));

  return items.map((item) => ({
    ...item,
    faculty_name: profileMap.get(item.faculty_id) || 'Faculty',
  }));
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

    const announcements = await attachFacultyNames(data || []);
    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Faculty announcements auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const formData = await request.formData();

    const subject = formData.get('subject')?.toString().trim();
    const description = formData.get('description')?.toString().trim() || null;
    const link = formData.get('link')?.toString().trim() || null;
    const clubName = formData.get('clubName')?.toString().trim();
    const image = formData.get('image');

    if (!subject || !clubName) {
      return NextResponse.json({ error: 'Subject and club name are required' }, { status: 400 });
    }

    if (!ANNOUNCEMENT_CLUBS.includes(clubName as any)) {
      return NextResponse.json({ error: 'Invalid club name' }, { status: 400 });
    }

    if (link) {
      try {
        new URL(link);
      } catch {
        return NextResponse.json({ error: 'Link must be a valid URL' }, { status: 400 });
      }
    }

    let imageUrl: string | null = null;

    if (image instanceof File && image.size > 0) {
      const fileExt = image.name.includes('.') ? image.name.split('.').pop() : 'jpg';
      const filePath = `${user.id}/${Date.now()}-${subject.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${fileExt}`;

      const { error: uploadError } = await storageClient.storage
        .from('announcement-images')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Announcement image upload error:', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/announcement-images/${filePath}`;
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        faculty_id: user.id,
        club_name: clubName,
        subject,
        description,
        link,
        image_url: imageUrl,
      })
      .select('id, faculty_id, club_name, subject, description, link, image_url, created_at')
      .single();

    if (error) {
      console.error('Faculty announcements POST error:', error);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    const announcements = await attachFacultyNames([data]);
    return NextResponse.json({ announcement: announcements[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Faculty announcements POST auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
