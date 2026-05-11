import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RESOURCE_TYPES, STORAGE_BUCKET } from '@/lib/learning-resources';

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
  if (!roles.includes('faculty')) throw { status: 403, message: 'Forbidden' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, name')
    .eq('id', user.id)
    .single();

  return {
    user,
    name: profile?.name || (user.user_metadata as any)?.name || user.email || 'Faculty',
  };
}

// GET: list the faculty's own uploads (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const semester = searchParams.get('semester');
    const scope = searchParams.get('scope'); // "mine" (default) | "all"

    let query = supabaseAdmin
      .from('learning_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (scope !== 'all') {
      query = query.eq('uploaded_by', user.id);
    }
    if (type && RESOURCE_TYPES.includes(type as any)) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch resources', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ resources: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: create a resource (metadata + file_url from prior client-side upload, or external_link)
export async function POST(request: NextRequest) {
  try {
    const { user, name } = await authenticateFaculty(request);
    const body = await request.json();
    const {
      title, description, type, subject, subject_code,
      semester, department, section,
      file_url, file_type, file_size, external_link, storage_path,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!type || !RESOURCE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!file_url && !external_link) {
      return NextResponse.json({ error: 'Provide a file or an external link' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('learning_resources')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        type,
        subject: subject.trim(),
        subject_code: subject_code?.trim() || null,
        semester: semester || null,
        department: department || null,
        section: section || null,
        file_url: file_url || null,
        file_type: file_type || null,
        file_size: file_size ?? null,
        external_link: external_link?.trim() || null,
        storage_path: storage_path || null,
        uploaded_by: user.id,
        uploaded_by_name: name,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create resource', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ resource: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: update own resource
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (updates.type && !RESOURCE_TYPES.includes(updates.type)) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('learning_resources')
      .select('uploaded_by')
      .eq('id', id)
      .single();
    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    if (existing.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own uploads' }, { status: 403 });
    }

    const allowed = [
      'title', 'description', 'type', 'subject', 'subject_code',
      'semester', 'department', 'section',
      'file_url', 'file_type', 'file_size', 'external_link', 'storage_path',
    ];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) {
      if (k in updates) payload[k] = updates[k];
    }

    const { data, error } = await supabaseAdmin
      .from('learning_resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update resource', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ resource: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// DELETE: delete own resource and its storage object
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('learning_resources')
      .select('uploaded_by, storage_path')
      .eq('id', id)
      .single();
    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    if (existing.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own uploads' }, { status: 403 });
    }

    if (existing.storage_path) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([existing.storage_path]);
    }

    const { error } = await supabaseAdmin
      .from('learning_resources')
      .delete()
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Failed to delete resource', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
