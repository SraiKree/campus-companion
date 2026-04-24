import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function authenticateAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'admin') return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await authenticateAdmin(request);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    const supabase = getSupabase();
    const { data: reports, error } = await supabase
      .from('discussion_reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const messageIds = (reports || []).map(r => r.message_id);
    const { data: messages } = messageIds.length
      ? await supabase
          .from('discussion_messages')
          .select('id, subject_code, subject_name, user_id, user_name, user_role, user_department, user_section, content, is_hidden, created_at')
          .in('id', messageIds)
      : { data: [] as any[] };

    const msgMap = new Map((messages || []).map(m => [m.id, m]));
    const enriched = (reports || []).map(r => ({ ...r, message: msgMap.get(r.message_id) || null }));

    return NextResponse.json({ reports: enriched });
  } catch (e: any) {
    console.error('GET /api/admin/discussion-reports', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
