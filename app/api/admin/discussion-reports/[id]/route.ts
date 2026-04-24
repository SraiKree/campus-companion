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

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateAdmin(request);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await ctx.params;
    const body = await request.json();
    const action: 'hide' | 'dismiss' = body.action;
    const notes: string | undefined = body.notes?.trim();

    if (action !== 'hide' && action !== 'dismiss') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: report, error: repErr } = await supabase
      .from('discussion_reports')
      .select('id, message_id, status')
      .eq('id', id)
      .maybeSingle();

    if (repErr) throw repErr;
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    if (report.status !== 'pending') {
      return NextResponse.json({ error: 'Report already resolved' }, { status: 400 });
    }

    if (action === 'hide') {
      const { error: hideErr } = await supabase
        .from('discussion_messages')
        .update({
          is_hidden: true,
          hidden_reason: notes || 'Moderated by admin',
          hidden_at: new Date().toISOString(),
        })
        .eq('id', report.message_id);
      if (hideErr) throw hideErr;
    }

    const { error: updErr } = await supabase
      .from('discussion_reports')
      .update({
        status: action === 'hide' ? 'actioned' : 'dismissed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: notes || null,
      })
      .eq('id', id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/admin/discussion-reports/[id]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
