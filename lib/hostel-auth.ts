import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Simple session token scheme for hostel admin.
// Token format: base64("hostelAdminId:issuedAt"). Good enough for a separate
// login flow that mirrors the project's existing default-password pattern.

const TOKEN_PREFIX = 'hostel:';

export function issueHostelAdminToken(adminId: string): string {
  const raw = `${adminId}:${Date.now()}`;
  const encoded =
    typeof window === 'undefined'
      ? Buffer.from(raw).toString('base64')
      : btoa(raw);
  return `${TOKEN_PREFIX}${encoded}`;
}

export function parseHostelAdminToken(token: string | null): string | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  try {
    const encoded = token.slice(TOKEN_PREFIX.length);
    const raw =
      typeof window === 'undefined'
        ? Buffer.from(encoded, 'base64').toString('utf8')
        : atob(encoded);
    const [adminId] = raw.split(':');
    return adminId || null;
  } catch {
    return null;
  }
}

export async function authenticateHostelAdmin(
  request: NextRequest
): Promise<{ id: string; email: string; name: string; role: string }> {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.split('Bearer ')[1] : null;
  const adminId = parseHostelAdminToken(token);

  if (!adminId) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const { data, error } = await supabaseAdmin
    .from('hostel_admins')
    .select('id, email, name, role')
    .eq('id', adminId)
    .single();

  if (error || !data) {
    throw { status: 401, message: 'Invalid admin session' };
  }

  return data;
}
