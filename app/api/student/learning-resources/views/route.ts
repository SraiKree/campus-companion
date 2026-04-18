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

// GET: recently viewed resources (deduped, most recent first)
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { data, error } = await supabaseAdmin
      .from('resource_views')
      .select('resource_id, viewed_at, resource:learning_resources(*)')
      .eq('student_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(40);

    if (error) {
      return NextResponse.json({ error: 'Failed to load recent views' }, { status: 500 });
    }

    const seen = new Set<string>();
    const resources: any[] = [];
    for (const row of (data || []) as any[]) {
      if (!row.resource || seen.has(row.resource_id)) continue;
      seen.add(row.resource_id);
      resources.push({ ...row.resource, viewed_at: row.viewed_at });
      if (resources.length >= 12) break;
    }

    // Attach bookmark flag
    const ids = resources.map((r) => r.id);
    if (ids.length) {
      const { data: bm } = await supabaseAdmin
        .from('resource_bookmarks')
        .select('resource_id')
        .eq('student_id', user.id)
        .in('resource_id', ids);
      const bmSet = new Set((bm || []).map((b) => b.resource_id));
      for (const r of resources) r.is_bookmarked = bmSet.has(r.id);
    }

    return NextResponse.json({ resources });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: log a view
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const { resource_id } = await request.json();
    if (!resource_id) return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('resource_views')
      .insert({ student_id: user.id, resource_id });

    if (error) {
      return NextResponse.json({ error: 'Failed to log view', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
