import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
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
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !roleData || roleData.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('class_name')
    .eq('id', user.id)
    .single();

  const className = profile?.class_name ?? null;

  const assignmentsQuery = supabase.from('assignments').select('*');
  const { data: assignments } = className
    ? await assignmentsQuery.eq('class_name', className)
    : await assignmentsQuery;

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('student_id', user.id);

  const assignmentsList = Array.isArray(assignments) ? assignments : [];

  const result = assignmentsList.map((a) => {

    const submission = submissions?.find((s) => s.assignment_id === a.id);
    const submitted = Boolean(submission);
    const graded = submission?.marks != null;

    const status: 'pending' | 'submitted' | 'graded' = graded
      ? 'graded'
      : submitted
        ? 'submitted'
        : 'pending';

    return {
      ...a,
      status,
      marks: submission?.marks ?? null,
      feedback: submission?.feedback ?? null,
      file_url: submission?.file_url ?? null,
      submitted_at: submission?.submitted_at ?? null,
    };

  });

  return NextResponse.json(result || []);
}