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

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const messageId: string | undefined = body.message_id;
    const reason: string | undefined = body.reason?.trim();

    if (!messageId) return NextResponse.json({ error: 'message_id required' }, { status: 400 });
    if (!reason) return NextResponse.json({ error: 'Reason required' }, { status: 400 });
    if (reason.length > 500) return NextResponse.json({ error: 'Reason too long (max 500 chars)' }, { status: 400 });

    const supabase = getSupabase();

    // Gate: reporter must be onboarded too
    const { data: details } = await supabase
      .from('student_details')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!details) {
      return NextResponse.json(
        { error: 'Complete your profile onboarding before reporting.', code: 'ONBOARDING_REQUIRED' },
        { status: 403 }
      );
    }

    const { data: msg } = await supabase
      .from('discussion_messages')
      .select('id, user_id')
      .eq('id', messageId)
      .maybeSingle();

    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (msg.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot report your own message' }, { status: 400 });
    }

    const { error: insertErr } = await supabase
      .from('discussion_reports')
      .insert({
        message_id: messageId,
        reporter_id: user.id,
        reporter_name: details.full_name || 'Student',
        reason,
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'You have already reported this message' }, { status: 409 });
      }
      throw insertErr;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/student/discussions/report', e);
    return NextResponse.json({ error: e.message || 'Failed to report' }, { status: 500 });
  }
}
