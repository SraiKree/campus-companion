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

  // Ensure the user has a faculty role before allowing access
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

export async function GET(request: NextRequest) {
  try {
    const { user, facultyIds } = await authenticateFaculty(request);

    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .in('faculty_id', facultyIds)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('assignment_id, marks')
      .in('assignment_id', (assignments || []).map((a: any) => a.id));

    const statsMap = new Map<string, { submission_count: number; pending_reviews: number; graded_count: number }>();

    (submissions || []).forEach((s: any) => {
      const assignmentId = s.assignment_id;
      const current = statsMap.get(assignmentId) ?? { submission_count: 0, pending_reviews: 0, graded_count: 0 };
      current.submission_count += 1;
      if (s.marks == null) {
        current.pending_reviews += 1;
      } else {
        current.graded_count += 1;
      }
      statsMap.set(assignmentId, current);
    });

    const enriched = (assignments || []).map((a: any) => {
      const stats = statsMap.get(a.id) ?? { submission_count: 0, pending_reviews: 0, graded_count: 0 };
      return {
        ...a,
        submission_count: stats.submission_count,
        pending_reviews: stats.pending_reviews,
        graded_count: stats.graded_count,
      };
    });

    return NextResponse.json({ assignments: enriched });
  } catch (error: any) {
    console.error('Faculty assignments GET error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();

    const { title, subject, class_name, deadline, total_marks, description } = body;

    if (!title || !subject || !class_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        title,
        subject,
        class_name,
        deadline: deadline || null,
        total_marks: total_marks ?? null,
        description: description || null,
        faculty_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    return NextResponse.json({ assignment: data });
  } catch (error: any) {
    console.error('Faculty assignments POST error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
