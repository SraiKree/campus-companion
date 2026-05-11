import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface AuthenticatedFaculty {
  user: { id: string; email: string | null };
  designation: string;
  department: string;
  name: string;
}

/**
 * Validates that the request comes from a logged-in faculty user.
 * Throws { status, message } on failure.
 */
export async function authenticateFaculty(request: NextRequest): Promise<AuthenticatedFaculty> {
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
  if (!roles.includes('faculty')) throw { status: 403, message: 'Forbidden' };

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, name, department, designation').eq('id', user.id).single();

  return {
    user: { id: user.id, email: user.email ?? null },
    designation: (profile?.designation || (user.user_metadata as any)?.designation || 'faculty').toLowerCase(),
    department: profile?.department || (user.user_metadata as any)?.department || '',
    name: profile?.name || (user.user_metadata as any)?.name || user.email || 'Faculty',
  };
}
