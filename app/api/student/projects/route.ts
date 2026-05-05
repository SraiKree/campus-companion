import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateStudent } from '@/lib/student-auth';

export async function GET(request: NextRequest) {
  try {
    const { rollNumber } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('student_projects')
      .select('*')
      .ilike('student_roll', rollNumber)
      .order('submitted_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rollNumber, name } = await authenticateStudent(request);
    const body = await request.json();

    if (!body.title || !body.guide_id) {
      return NextResponse.json({ error: 'title and guide_id are required' }, { status: 400 });
    }

    const { data: guideProfile } = await supabaseAdmin
      .from('profiles').select('name').eq('id', body.guide_id).single();

    const { data, error } = await supabaseAdmin
      .from('student_projects')
      .insert([{
        student_roll: rollNumber,
        student_name: name,
        team_members: body.team_members || null,
        title: body.title,
        description: body.description || null,
        domain: body.domain || null,
        guide_id: body.guide_id,
        guide_name: guideProfile?.name || null,
        file_url: body.file_url || null,
        status: 'submitted',
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
