import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SPORT_CATEGORIES } from '@/lib/sports';

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
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'faculty' && role !== 'sport_admin') throw { status: 403, message: 'Forbidden' };

  return { user };
}

// GET: list all sports (faculty sees active + inactive)
export async function GET(request: NextRequest) {
  try {
    await authenticateFaculty(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabaseAdmin
      .from('sports')
      .select('id, name, category, coach, coach_email, schedule, venue, description, icon, is_active, created_at, updated_at')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category && SPORT_CATEGORIES.includes(category as any)) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sports' }, { status: 500 });
    }

    return NextResponse.json({ sports: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: create sport
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();
    const { name, category, coach, coach_email, schedule, venue, description, icon } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!category || !SPORT_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sports')
      .insert({
        name: name.trim(),
        category,
        coach: coach?.trim() || null,
        coach_email: coach_email?.trim() || null,
        schedule: schedule?.trim() || null,
        venue: venue?.trim() || null,
        description: description?.trim() || null,
        icon: icon || 'Trophy',
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A sport with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create sport', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ sport: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: update sport
export async function PATCH(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (updates.category && !SPORT_CATEGORIES.includes(updates.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const allowed = ['name', 'category', 'coach', 'coach_email', 'schedule', 'venue', 'description', 'icon', 'is_active'];
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) {
      if (k in updates) payload[k] = updates[k];
    }

    const { data, error } = await supabaseAdmin
      .from('sports')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update sport', details: error.message }, { status: 500 });

    return NextResponse.json({ sport: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('sports').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete sport', details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
