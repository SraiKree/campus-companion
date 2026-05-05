import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHr } from '@/lib/hr-auth';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    await authenticateHr(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabaseAdmin
      .from('hr_employees')
      .select('id, email, full_name, employee_code, department, designation, employment_type, status, date_of_joining', { count: 'exact' })
      .order('full_name', { ascending: true });

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,employee_code.ilike.%${q}%,department.ilike.%${q}%`);
    }
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      employees: data || [],
      page,
      page_size: PAGE_SIZE,
      total: count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateHr(request);
    const body = await request.json();

    if (!body.email || !body.full_name) {
      return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 });
    }

    // If a faculty auth user already exists for this email, link it.
    let user_id: string | null = null;
    try {
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      const match = usersList?.users?.find(u => (u.email || '').toLowerCase() === body.email.toLowerCase());
      if (match) user_id = match.id;
    } catch { /* listUsers may not be available; ignore */ }

    const { data, error } = await supabaseAdmin
      .from('hr_employees')
      .insert([{
        user_id,
        email: body.email,
        full_name: body.full_name,
        employee_code: body.employee_code ?? null,
        department: body.department ?? null,
        designation: body.designation ?? null,
        employment_type: body.employment_type ?? 'full-time',
        status: body.status ?? 'active',
        date_of_joining: body.date_of_joining ?? null,
        date_of_birth: body.date_of_birth ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        emergency_contact: body.emergency_contact ?? null,
        basic_salary: body.basic_salary ?? 0,
        hra: body.hra ?? 0,
        allowances: body.allowances ?? 0,
        pf_deduction: body.pf_deduction ?? 0,
        tax_deduction: body.tax_deduction ?? 0,
        notes: body.notes ?? null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ employee: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
