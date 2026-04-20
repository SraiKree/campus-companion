import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request);
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, priority, target_role, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    return NextResponse.json({ notifications: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateAdmin(request);
    const body = await request.json();

    const title = body?.title?.toString().trim();
    const message = body?.message?.toString().trim();
    const priority = (body?.priority || 'medium').toString().toLowerCase();
    const rollNumber = body?.roll_number?.toString().trim().toUpperCase();

    if (!title || !message) return NextResponse.json({ error: 'title and message required' }, { status: 400 });
    if (!(PRIORITIES as readonly string[]).includes(priority)) {
      return NextResponse.json({ error: 'invalid priority' }, { status: 400 });
    }

    let userId: string | null = null;
    let target: 'student' | 'all' = rollNumber ? 'student' : 'all';

    if (rollNumber) {
      const { data: s } = await supabaseAdmin
        .from('students25').select('id, email').ilike('roll_number', rollNumber).single();
      if (!s) return NextResponse.json({ error: 'No student with that roll number' }, { status: 404 });
      userId = s.id ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        title,
        message,
        priority,
        target_role: target === 'all' ? 'student' : 'student',
        user_id: userId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to send', details: error.message }, { status: 500 });
    return NextResponse.json({ notification: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
