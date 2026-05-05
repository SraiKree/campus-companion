import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    let { data: emp } = await supabaseAdmin
      .from('hr_employees').select('id, full_name').eq('user_id', user.id).maybeSingle();
    if (!emp && user.email) {
      const res = await supabaseAdmin.from('hr_employees').select('id, full_name').ilike('email', user.email).maybeSingle();
      emp = res.data;
    }
    if (!emp) {
      return NextResponse.json({ incentives: [], total: 0 });
    }

    const { data, error } = await supabaseAdmin
      .from('incentives')
      .select('id, category, title, amount, awarded_date, description, status, created_at')
      .eq('employee_id', emp.id)
      .order('awarded_date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const total = (data || []).reduce((sum, r: any) => sum + Number(r.amount || 0), 0);
    return NextResponse.json({ incentives: data || [], total });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
