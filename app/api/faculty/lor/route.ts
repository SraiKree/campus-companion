import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('lor_requests')
      .select('*')
      .eq('faculty_id', user.id)
      .order('requested_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();

    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }
    if (!['approved', 'rejected', 'completed'].includes(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      status: body.status,
      faculty_response: body.faculty_response ?? null,
      decided_at: new Date().toISOString(),
    };
    if (body.status === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (body.lor_url) updates.lor_url = body.lor_url;
    }

    const { data, error } = await supabaseAdmin
      .from('lor_requests')
      .update(updates)
      .eq('id', body.id)
      .eq('faculty_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
