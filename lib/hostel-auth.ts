import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verifies that the incoming request carries a valid Supabase access token
// AND that the authenticated user has role === 'hostel' (warden / admin).
// Mirrors the authenticateStudent() pattern used in /api/student/complaints.
export async function authenticateHostelAdmin(
  request: NextRequest
): Promise<{ id: string; email: string | null }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : null;

  if (!token) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  // Role check: metadata first, fall back to user_roles table
  const metadataRole = (user.user_metadata as any)?.role;
  let role = typeof metadataRole === 'string' ? metadataRole.toLowerCase() : '';

  if (role !== 'hostel') {
    const { data: roleRow } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    role = (roleRow?.role ?? '').toString().toLowerCase();
  }

  if (role !== 'hostel') {
    throw { status: 403, message: 'Forbidden' };
  }

  return { id: user.id, email: user.email ?? null };
}
