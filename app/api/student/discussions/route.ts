import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function authenticate(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const subjectCode = url.searchParams.get('subject_code');
    if (!subjectCode) {
      return NextResponse.json({ error: 'subject_code required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('discussion_messages')
      .select('id, subject_code, user_id, user_name, user_role, user_department, user_section, content, is_hidden, created_at')
      .eq('subject_code', subjectCode)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    const myReports = await supabase
      .from('discussion_reports')
      .select('message_id')
      .eq('reporter_id', user.id)
      .in('message_id', (data || []).map(m => m.id));

    const reportedIds = new Set((myReports.data || []).map(r => r.message_id));

    return NextResponse.json({
      messages: (data || []).map(m => ({ ...m, reported_by_me: reportedIds.has(m.id) })),
      currentUserId: user.id,
    });
  } catch (e: any) {
    console.error('GET /api/student/discussions', e);
    return NextResponse.json({ error: e.message || 'Failed to load' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const subjectCode: string | undefined = body.subject_code;
    const subjectName: string | undefined = body.subject_name;
    const content: string | undefined = body.content?.trim();

    if (!subjectCode) return NextResponse.json({ error: 'subject_code required' }, { status: 400 });
    if (!content) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });

    const supabase = getSupabase();

    // Onboarding gate: student must have a row in student_details
    const { data: details, error: detailsErr } = await supabase
      .from('student_details')
      .select('id, full_name, department')
      .eq('user_id', user.id)
      .maybeSingle();

    if (detailsErr) throw detailsErr;
    if (!details) {
      return NextResponse.json(
        { error: 'Complete your profile onboarding before joining discussions.', code: 'ONBOARDING_REQUIRED' },
        { status: 403 }
      );
    }

    // Look up profile for section / role display metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, department, class_name, roll_no')
      .eq('id', user.id)
      .maybeSingle();

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const roleRow = roleRows?.find((r: any) => String(r?.role ?? '').toLowerCase() === 'student') ?? roleRows?.[0] ?? null;

    const { data: student } = await supabase
      .from('students25')
      .select('name, department, section')
      .eq('roll_number', profile?.roll_no || '')
      .maybeSingle();

    const { data: inserted, error: insertErr } = await supabase
      .from('discussion_messages')
      .insert({
        subject_code: subjectCode,
        subject_name: subjectName || null,
        user_id: user.id,
        user_name: details.full_name || profile?.name || 'Student',
        user_role: roleRow?.role || 'student',
        user_department: details.department || profile?.department || student?.department || null,
        user_section: student?.section || profile?.class_name || null,
        content,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ message: inserted }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/student/discussions', e);
    return NextResponse.json({ error: e.message || 'Failed to post' }, { status: 500 });
  }
}
