import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { COMPLAINT_CATEGORIES, DEPARTMENTS, COMPLAINT_STATUSES, PRIVILEGED_DESIGNATIONS } from '@/lib/complaints';

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
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  // Check role
  const roleFromMetadata = (user.user_metadata as any)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('faculty')) {
    throw { status: 403, message: 'Forbidden' };
  }

  // Get faculty profile for department and designation
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, name, department, designation')
    .eq('id', user.id)
    .single();

  const designation = (profile?.designation || (user.user_metadata as any)?.designation || 'faculty').toLowerCase();
  const department = profile?.department || (user.user_metadata as any)?.department || '';

  return { user, designation, department };
}

// GET: Fetch complaints based on faculty designation
export async function GET(request: NextRequest) {
  try {
    const { designation, department } = await authenticateFaculty(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const filterDept = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const revealIdentity = searchParams.get('revealIdentity') === 'true';

    const isPrivileged = PRIVILEGED_DESIGNATIONS.includes(designation as any);

    // Build select fields — only privileged users can access identity
    const selectFields = isPrivileged && revealIdentity
      ? 'id, title, description, category, department, image_urls, status, created_at, updated_at, student_name, student_roll_number'
      : 'id, title, description, category, department, image_urls, status, created_at, updated_at';

    let query = supabaseAdmin
      .from('complaints')
      .select(selectFields)
      .order('created_at', { ascending: false });

    // HODs only see their own department's complaints
    if (!isPrivileged) {
      query = query.eq('department', department);
    }

    // Apply filters
    if (category && COMPLAINT_CATEGORIES.includes(category as any)) {
      query = query.eq('category', category);
    }
    if (filterDept && DEPARTMENTS.includes(filterDept as any) && isPrivileged) {
      query = query.eq('department', filterDept);
    }
    if (status && COMPLAINT_STATUSES.includes(status as any)) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Faculty complaints fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    return NextResponse.json({
      complaints: data || [],
      isPrivileged,
      facultyDepartment: department,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// PATCH: Update complaint status (faculty only)
export async function PATCH(request: NextRequest) {
  try {
    const { designation, department } = await authenticateFaculty(request);

    const body = await request.json();
    const { complaintId, status } = body;

    if (!complaintId) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }
    if (!status || !COMPLAINT_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const isPrivileged = PRIVILEGED_DESIGNATIONS.includes(designation as any);

    // Verify faculty has access to this complaint
    if (!isPrivileged) {
      const { data: complaint } = await supabaseAdmin
        .from('complaints')
        .select('department')
        .eq('id', complaintId)
        .single();

      if (!complaint || complaint.department !== department) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', complaintId)
      .select('id, status, updated_at')
      .single();

    if (error) {
      console.error('Complaint status update error:', error);
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
    }

    return NextResponse.json({ complaint: data });
  } catch (err: any) {
    console.error('Faculty complaints PATCH error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
