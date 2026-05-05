import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHr } from '@/lib/hr-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateHr(request);
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');

    let query = supabaseAdmin
      .from('hr_documents')
      .select('id, employee_id, doc_type, title, file_url, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(200);

    if (employee_id) query = query.eq('employee_id', employee_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateHr(request);
    const body = await request.json();

    if (!body.employee_id || !body.doc_type || !body.title) {
      return NextResponse.json({ error: 'employee_id, doc_type, and title are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('hr_documents')
      .insert([{
        employee_id: body.employee_id,
        doc_type: body.doc_type,
        title: body.title,
        file_url: body.file_url ?? null,
        uploaded_by: auth.user.id,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
