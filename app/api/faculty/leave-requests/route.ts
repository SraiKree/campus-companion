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

  const { data: roleRows } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());

  if (!roles.includes('faculty')) {
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
    const { facultyIds } = await authenticateFaculty(request);
    const status = new URL(request.url).searchParams.get('status');

    const { data: classes, error: classesError } = await supabaseAdmin
      .from('faculty_classes')
      .select('section')
      .in('faculty_id', facultyIds);

    if (classesError) {
      console.error('Faculty leave requests class lookup error:', classesError);
      return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
    }

    const classNames = Array.from(new Set((classes ?? []).map((item: any) => item.section).filter(Boolean)));

    if (classNames.length === 0) {
      return NextResponse.json({ leaveRequests: [] });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, roll_no, class_name')
      .in('class_name', classNames);

    if (profilesError) {
      console.error('Faculty leave requests profile lookup error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
    }

    const studentIds = (profiles ?? []).map((profile: any) => profile.id);

    if (studentIds.length === 0) {
      return NextResponse.json({ leaveRequests: [] });
    }

    let query = supabaseAdmin
      .from('leave_requests')
      .select('id, student_id, reason, from_date, to_date, status, created_at')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Faculty leave requests GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
    }

    const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
    const leaveRequests = (data ?? []).map((request: any) => {
      const profile = profileMap.get(request.student_id);
      return {
        ...request,
        student_name: profile?.name ?? 'Unknown',
        student_roll_no: profile?.roll_no ?? null,
        class_name: profile?.class_name ?? null,
      };
    });

    return NextResponse.json({ leaveRequests });
  } catch (error: any) {
    console.error('Faculty leave requests auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { facultyIds } = await authenticateFaculty(request);
    const body = await request.json();

    const leaveRequestId = body?.leaveRequestId?.toString();
    const status = body?.status?.toString();

    if (!leaveRequestId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid leave request id and status are required' }, { status: 400 });
    }

    const { data: classes, error: classesError } = await supabaseAdmin
      .from('faculty_classes')
      .select('section')
      .in('faculty_id', facultyIds);

    if (classesError) {
      console.error('Faculty leave requests class lookup error:', classesError);
      return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }

    const classNames = Array.from(new Set((classes ?? []).map((item: any) => item.section).filter(Boolean)));
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('class_name', classNames);

    if (profilesError) {
      console.error('Faculty leave requests profile lookup error:', profilesError);
      return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }

    const studentIds = (profiles ?? []).map((profile: any) => profile.id);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .eq('id', leaveRequestId)
      .in('student_id', studentIds)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('leave_requests')
      .update({ status })
      .eq('id', leaveRequestId);

    if (error) {
      console.error('Faculty leave requests PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Faculty leave requests PATCH auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
