import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedTransport {
  user: { id: string; email: string | null };
}

export async function authenticateTransport(request: NextRequest): Promise<AuthenticatedTransport> {
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

  const roleFromMetadata = (user.user_metadata as Record<string, unknown> | undefined)?.role;
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'transport') throw { status: 403, message: 'Forbidden' };

  return { user: { id: user.id, email: user.email ?? null } };
}
