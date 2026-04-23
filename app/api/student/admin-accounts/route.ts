import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MODULES = [
  'certificate', 'scholarship', 'letterhead', 'fee_query',
  'internet', 'id_card', 'event_media', 'event_bill',
] as const;
type ModuleType = typeof MODULES[number];

async function authenticateStudent(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  if (!token) throw { status: 401, message: 'Unauthorized' };

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw { status: 401, message: 'Unauthorized' };

  const metaRole = (user.user_metadata as Record<string, unknown> | undefined)?.role;
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();
  const role = (roleData?.role || metaRole || '').toString().toLowerCase();
  if (role !== 'student') throw { status: 403, message: 'Forbidden' };

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('student_admin_account_requests')
      .select('id, module_type, sub_type, purpose, description, required_by, details, attachment_url, status, admin_remarks, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);
    const body = await request.json();

    const module_type = String(body.module_type || '').trim() as ModuleType;
    if (!MODULES.includes(module_type)) {
      return NextResponse.json({ error: 'Invalid module_type' }, { status: 400 });
    }

    const purpose = String(body.purpose || '').trim();
    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const studentName = (meta?.name as string) || user.email || 'Unknown';
    const studentRoll = ((meta?.roll_no || meta?.roll_number || '') as string).toString().toUpperCase();

    const { data, error } = await supabaseAdmin
      .from('student_admin_account_requests')
      .insert({
        student_id: user.id,
        student_roll: studentRoll || null,
        student_name: studentName,
        module_type,
        sub_type: body.sub_type ? String(body.sub_type).trim() : null,
        purpose,
        description: body.description ? String(body.description).trim() : null,
        required_by: body.required_by || null,
        details: body.details && typeof body.details === 'object' ? body.details : {},
        attachment_url: body.attachment_url ? String(body.attachment_url).trim() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
