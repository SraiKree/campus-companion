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
  const { data: roleRows } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) throw { status: 403, message: 'Forbidden' };

  return { user };
}

// GET: list the student's bookmarked resources with full resource data
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { data, error } = await supabaseAdmin
      .from('resource_bookmarks')
      .select('resource_id, created_at, resource:learning_resources(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load bookmarks', details: error.message }, { status: 500 });
    }

    const resources = (data || [])
      .map((row: any) => row.resource ? { ...row.resource, is_bookmarked: true } : null)
      .filter(Boolean);

    return NextResponse.json({ resources });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: add a bookmark
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { resource_id } = await request.json();
    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('resource_bookmarks')
      .upsert({ student_id: user.id, resource_id }, { onConflict: 'student_id,resource_id' });

    if (error) {
      return NextResponse.json({ error: 'Failed to bookmark', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// DELETE: remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { searchParams } = new URL(request.url);
    const resource_id = searchParams.get('resource_id');
    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('resource_bookmarks')
      .delete()
      .eq('student_id', user.id)
      .eq('resource_id', resource_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove bookmark', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
