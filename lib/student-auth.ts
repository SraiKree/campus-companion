import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface AuthenticatedStudent {
  user: { id: string; email: string | null };
  rollNumber: string;
  name: string;
}

/**
 * Validates that the request comes from a logged-in student.
 * Resolves the student's roll number by matching their auth email
 * against students25.email. Throws { status, message } on failure.
 */
export async function authenticateStudent(request: NextRequest): Promise<AuthenticatedStudent> {
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

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id);
  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) throw { status: 403, message: 'Forbidden' };

  let rollNumber = '';
  let name = '';
  if (user.email) {
    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name')
      .ilike('email', user.email)
      .single();
    if (student) {
      rollNumber = String(student.roll_number).trim();
      name = student.name || '';
    }
  }
  if (!rollNumber) {
    rollNumber = ((user.user_metadata as any)?.roll_no || '').toString().trim();
    name = name || ((user.user_metadata as any)?.name || user.email || 'Student');
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    rollNumber,
    name,
  };
}
