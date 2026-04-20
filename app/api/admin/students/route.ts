import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabaseAdmin
      .from('students25')
      .select('roll_number, name, email, department, section, semester, year', { count: 'exact' })
      .order('roll_number', { ascending: true });

    if (q) {
      query = query.or(`roll_number.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count, error } = await query.range(from, to);
    if (error) return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });

    return NextResponse.json({
      students: data || [],
      page,
      page_size: PAGE_SIZE,
      total: count ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
