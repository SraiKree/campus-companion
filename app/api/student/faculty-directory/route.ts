import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateStudent } from '@/lib/student-auth';

/**
 * Returns a list of faculty members students can pick as their LOR
 * recommender or project guide. Sourced from profiles where role is faculty.
 */
export async function GET(request: NextRequest) {
  try {
    await authenticateStudent(request);

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'faculty');

    const facultyIds = (roles || []).map(r => r.user_id);
    if (facultyIds.length === 0) return NextResponse.json({ faculty: [] });

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, department, designation, email')
      .in('id', facultyIds)
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ faculty: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
