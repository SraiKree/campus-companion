import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

/**
 * Returns the faculty's own payslips. Looks up their hr_employees row by
 * user_id (or email fallback) and returns all payslips ordered newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    let { data: emp } = await supabaseAdmin
      .from('hr_employees')
      .select('id, full_name, employee_code, basic_salary, hra, allowances, pf_deduction, tax_deduction')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!emp && user.email) {
      const res = await supabaseAdmin
        .from('hr_employees')
        .select('id, full_name, employee_code, basic_salary, hra, allowances, pf_deduction, tax_deduction')
        .ilike('email', user.email)
        .maybeSingle();
      emp = res.data;
    }

    if (!emp) {
      return NextResponse.json({ employee: null, payslips: [] });
    }

    const { data: payslips, error } = await supabaseAdmin
      .from('payslips')
      .select('id, pay_month, pay_year, basic_salary, hra, allowances, incentive_total, pf_deduction, tax_deduction, other_deductions, net_pay, status, generated_at, paid_at, remarks')
      .eq('employee_id', emp.id)
      .order('pay_year', { ascending: false })
      .order('pay_month', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ employee: emp, payslips: payslips || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
