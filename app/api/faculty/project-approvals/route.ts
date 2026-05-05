import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

/**
 * Faculty-side project approvals: lists projects where this faculty is
 * the assigned guide, OR projects in their department awaiting approval.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('student_projects')
      .select('*')
      .eq('guide_id', user.id)
      .order('submitted_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();

    if (!body.id || !body.decision) {
      return NextResponse.json({ error: 'id and decision are required' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(body.decision)) {
      return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 });
    }

    const newStatus = body.decision === 'approve' ? 'faculty-approved' : 'faculty-rejected';

    const { data, error } = await supabaseAdmin
      .from('student_projects')
      .update({
        status: newStatus,
        faculty_comments: body.comments ?? null,
        faculty_decided_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('guide_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
