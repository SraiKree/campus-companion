import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface AuthenticatedClub {
  user: { id: string; email: string | null };
  club: {
    id: string;
    name: string;
    description: string | null;
    advisor_name: string | null;
    contact_email: string | null;
    logo_url: string | null;
    is_active: boolean;
  };
}

export async function authenticateClub(request: NextRequest): Promise<AuthenticatedClub> {
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
  const { data: roleData } = await authClient
    .from('user_roles').select('role').eq('user_id', user.id).single();

  const role = (roleData?.role || roleFromMetadata || '').toString().toLowerCase();
  if (role !== 'club') throw { status: 403, message: 'Forbidden' };

  const { data: club, error: clubErr } = await supabaseAdmin
    .from('clubs')
    .select('id, name, description, advisor_name, contact_email, logo_url, is_active')
    .eq('user_id', user.id)
    .single();

  if (clubErr || !club) throw { status: 404, message: 'Club record not found for this user' };
  if (!club.is_active) throw { status: 403, message: 'Club is deactivated' };

  return { user: { id: user.id, email: user.email ?? null }, club };
}
