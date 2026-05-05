import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RESOURCE_TYPES } from '@/lib/learning-resources';

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
  const { data: roleRows } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) throw { status: 403, message: 'Forbidden' };

  return { user };
}

// GET: list resources (with filters + bookmark flag)
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const semester = searchParams.get('semester');
    const faculty = searchParams.get('faculty');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('learning_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (type && RESOURCE_TYPES.includes(type as any)) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (semester) query = query.eq('semester', semester);
    if (faculty) query = query.eq('uploaded_by', faculty);
    if (search) {
      query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: resources, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch resources', details: error.message }, { status: 500 });
    }

    const ids = (resources || []).map((r) => r.id);
    let bookmarks: Set<string> = new Set();
    if (ids.length) {
      const { data: bm } = await supabaseAdmin
        .from('resource_bookmarks')
        .select('resource_id')
        .eq('student_id', user.id)
        .in('resource_id', ids);
      bookmarks = new Set((bm || []).map((b) => b.resource_id));
    }

    const withFlag = (resources || []).map((r) => ({ ...r, is_bookmarked: bookmarks.has(r.id) }));

    // Also pull distinct facets for filter options
    const subjects = Array.from(new Set((resources || []).map((r) => r.subject).filter(Boolean))).sort();
    const faculties = Array.from(
      new Map(
        (resources || [])
          .filter((r) => r.uploaded_by_name)
          .map((r) => [r.uploaded_by, { id: r.uploaded_by, name: r.uploaded_by_name }])
      ).values()
    );

    return NextResponse.json({ resources: withFlag, subjects, faculties });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
