import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateStudent } from '@/lib/student-auth';

export async function GET(request: NextRequest) {
  try {
    const { rollNumber } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('lor_requests')
      .select('id, faculty_id, faculty_name, purpose, target_institution, application_deadline, message, status, faculty_response, lor_url, requested_at, decided_at, completed_at')
      .ilike('student_roll', rollNumber)
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, rollNumber, name } = await authenticateStudent(request);
    const body = await request.json();

    if (!body.faculty_id || !body.purpose) {
      return NextResponse.json({ error: 'faculty_id and purpose are required' }, { status: 400 });
    }

    // Resolve faculty name from profiles
    const { data: facultyProfile } = await supabaseAdmin
      .from('profiles').select('name').eq('id', body.faculty_id).single();

    const { data, error } = await supabaseAdmin
      .from('lor_requests')
      .insert([{
        student_roll: rollNumber,
        student_name: name,
        student_email: user.email,
        faculty_id: body.faculty_id,
        faculty_name: facultyProfile?.name || null,
        purpose: body.purpose,
        target_institution: body.target_institution || null,
        application_deadline: body.application_deadline || null,
        message: body.message || null,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
