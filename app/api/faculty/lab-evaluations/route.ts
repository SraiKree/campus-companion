import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject_code');
    const roll = searchParams.get('student_roll');

    let query = supabaseAdmin
      .from('lab_marks')
      .select('*')
      .eq('faculty_id', user.id)
      .order('evaluated_on', { ascending: false });

    if (subject) query = query.eq('subject_code', subject);
    if (roll) query = query.ilike('student_roll', roll);

    const { data, error } = await query.limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ marks: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();

    if (!body.student_roll || !body.subject_code || !body.lab_name || body.marks == null) {
      return NextResponse.json({ error: 'student_roll, subject_code, lab_name and marks are required' }, { status: 400 });
    }

    const { data: stu } = await supabaseAdmin
      .from('students25')
      .select('name')
      .ilike('roll_number', body.student_roll)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('lab_marks')
      .insert([{
        student_roll: String(body.student_roll).trim().toUpperCase(),
        student_name: body.student_name || stu?.name || null,
        subject_code: body.subject_code,
        subject_name: body.subject_name || null,
        faculty_id: user.id,
        lab_name: body.lab_name,
        marks: Number(body.marks),
        total_marks: Number(body.total_marks ?? 100),
        evaluated_on: body.evaluated_on || new Date().toISOString().slice(0, 10),
        remarks: body.remarks || null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mark: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('lab_marks').delete().eq('id', id).eq('faculty_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
