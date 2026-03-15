import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { supabaseAdmin } from '@/lib/supabase-admin';

async function getFacultyRecordId(user: any) {
  if (!user?.email) return null;

  const { data: facultyRecord } = await supabaseAdmin
    .from('faculty')
    .select('id')
    .eq('email', user.email)
    .limit(1)
    .single();

  return facultyRecord?.id ?? null;
}

async function authenticateFaculty(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const { data: roleData } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();

  if (role !== 'faculty') {
    throw { status: 403, message: 'Forbidden' };
  }

  const facultyRecordId = await getFacultyRecordId(user);
  const facultyIds = [user.id];
  if (facultyRecordId && facultyRecordId !== user.id) {
    facultyIds.push(facultyRecordId);
  }

  return { user, facultyIds };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const { facultyIds } = await authenticateFaculty(request);

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .in('faculty_id', facultyIds)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('assignment_submissions')
      .select('student_id, marks, feedback, submitted_at, file_url')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    const studentIds = Array.from(new Set((submissions || []).map((s: any) => s.student_id)));
    const { data: students } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .in('id', studentIds);

    const studentMap = new Map((students || []).map((s: any) => [s.id, s.name]));

    const formatted = (submissions || []).map((s: any) => ({
      student_id: s.student_id,
      student_name: studentMap.get(s.student_id) ?? 'Unknown',
      submitted_at: s.submitted_at,
      file_url: s.file_url,
      marks: s.marks,
      feedback: s.feedback,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Faculty submissions GET error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const { facultyIds } = await authenticateFaculty(request);

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .in('faculty_id', facultyIds)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const body = await request.json();
    const { studentId, marks, feedback } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('assignment_submissions')
      .update({
        marks: marks ?? null,
        feedback: feedback ?? null,
      })
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error updating submission:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Faculty submissions PATCH error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
