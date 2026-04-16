import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { COMPLAINT_CATEGORIES, DEPARTMENTS } from '@/lib/complaints';

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
  const { data: roleData } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'student') {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

// GET: Fetch all complaints (identity fields stripped for students)
export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('complaints')
      .select('id, title, description, category, department, image_urls, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (category && COMPLAINT_CATEGORIES.includes(category as any)) {
      query = query.eq('category', category);
    }
    if (department && DEPARTMENTS.includes(department as any)) {
      query = query.eq('department', department);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Complaints fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    return NextResponse.json({ complaints: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: Submit a new complaint
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const body = await request.json();
    const { title, description, category, department, image_urls } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!category || !COMPLAINT_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (!department || !DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }

    // Get student details from profile or metadata
    const studentName = (user.user_metadata as any)?.name || user.email || 'Unknown';
    const studentRollNo = (user.user_metadata as any)?.roll_no || '';

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        student_id: user.id,
        student_name: studentName,
        student_roll_number: studentRollNo,
        title: title.trim(),
        description: description.trim(),
        category,
        department,
        image_urls: Array.isArray(image_urls) ? image_urls : [],
        status: 'Submitted',
      })
      .select('id, title, category, department, status, created_at')
      .single();

    if (error) {
      console.error('Complaint insert error:', error);
      return NextResponse.json({ error: 'Failed to submit complaint', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ complaint: data }, { status: 201 });
  } catch (err: any) {
    console.error('Complaint POST error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
