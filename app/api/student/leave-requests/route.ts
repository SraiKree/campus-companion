import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { supabaseAdmin } from '@/lib/supabase-admin';

async function authenticateStudent(request: NextRequest) {
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

  if (role !== 'student') {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .select('id, student_id, reason, from_date, to_date, status, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Student leave requests GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
    }

    return NextResponse.json({
      leaveRequests: data ?? [],
    });
  } catch (error: any) {
    console.error('Student leave requests auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const body = await request.json();

    const reason = body?.reason?.toString().trim();
    const fromDate = body?.fromDate?.toString();
    const toDate = body?.toDate?.toString();

    if (!reason || !fromDate || !toDate) {
      return NextResponse.json({ error: 'Reason, from date and to date are required' }, { status: 400 });
    }

    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      return NextResponse.json({ error: 'From date cannot be after to date' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        student_id: user.id,
        reason,
        from_date: fromDate,
        to_date: toDate,
        status: 'pending',
      })
      .select('id, student_id, reason, from_date, to_date, status, created_at')
      .single();

    if (error) {
      console.error('Student leave requests POST error:', error);
      return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 });
    }

    return NextResponse.json({ leaveRequest: data }, { status: 201 });
  } catch (error: any) {
    console.error('Student leave requests POST auth error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 }
    );
  }
}
