import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { SPORT_CATEGORIES } from '@/lib/sports';

async function authenticateStudent(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

// GET: List sports (optional category filter)
export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('sports')
      .select('id, name, category, coach, coach_email, schedule, venue, description, icon, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category && SPORT_CATEGORIES.includes(category as any)) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,coach.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Sports fetch error:', error);
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
