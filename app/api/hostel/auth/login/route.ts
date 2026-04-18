import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { issueHostelAdminToken } from '@/lib/hostel-auth';

// POST /api/hostel/auth/login
// Separate login flow for hostel admin / warden. No Supabase Auth —
// uses the hostel_admins table with plain credentials (mirroring the
// students25 default-password pattern already used elsewhere).
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from('hostel_admins')
      .select('id, email, name, role, password')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (admin.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = issueHostelAdminToken(admin.id);

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
