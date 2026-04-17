import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const CERTIFICATE_TYPES = [
  'Bonafide', 'Study', 'Conduct', 'Character', 'Transfer', 'No Dues', 'Internship', 'Course Completion',
] as const;

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

// GET: Fetch the current student's own certificate requests
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('certificate_requests')
      .select('id, certificate_type, purpose, additional_details, required_by, status, remarks, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Certificate requests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: Submit a new certificate request
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const body = await request.json();
    const { certificate_type, purpose, additional_details, required_by } = body;

    if (!certificate_type || !CERTIFICATE_TYPES.includes(certificate_type)) {
      return NextResponse.json({ error: 'Invalid certificate type' }, { status: 400 });
    }
    if (!purpose?.trim()) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    const studentName = (user.user_metadata as any)?.name || user.email || 'Unknown';
    const studentRollNo = (user.user_metadata as any)?.roll_no || '';

    const { data, error } = await supabaseAdmin
      .from('certificate_requests')
      .insert({
        student_id: user.id,
        student_name: studentName,
        student_roll_number: studentRollNo,
        certificate_type,
        purpose: purpose.trim(),
        additional_details: additional_details?.trim() || null,
        required_by: required_by || null,
        status: 'Pending',
      })
      .select('id, certificate_type, purpose, required_by, status, created_at')
      .single();

    if (error) {
      console.error('Certificate request insert error:', error);
      return NextResponse.json({ error: 'Failed to submit request', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (err: any) {
    console.error('Certificate request POST error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
