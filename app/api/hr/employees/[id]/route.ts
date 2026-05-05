import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHr } from '@/lib/hr-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateHr(request);
    const { id } = await params;

    const { data: employee, error } = await supabaseAdmin
      .from('hr_employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const [docsRes, reviewsRes] = await Promise.all([
      supabaseAdmin
        .from('hr_documents')
        .select('id, doc_type, title, file_url, uploaded_at')
        .eq('employee_id', id)
        .order('uploaded_at', { ascending: false }),
      supabaseAdmin
        .from('hr_performance_reviews')
        .select('id, review_period, rating, strengths, areas_to_improve, reviewer_name, review_date, remarks')
        .eq('employee_id', id)
        .order('review_date', { ascending: false }),
    ]);

    return NextResponse.json({
      employee,
      documents: docsRes.data || [],
      performance_reviews: reviewsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateHr(request);
    const { id } = await params;
    const body = await request.json();

    const allowed = [
      'full_name','employee_code','department','designation','employment_type','status',
      'date_of_joining','date_of_birth','phone','address','emergency_contact',
      'basic_salary','hra','allowances','pf_deduction','tax_deduction',
      'casual_leave_balance','sick_leave_balance','earned_leave_balance','notes',
    ];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (k in body) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('hr_employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ employee: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticateHr(request);
    const { id } = await params;
    const { error } = await supabaseAdmin.from('hr_employees').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
