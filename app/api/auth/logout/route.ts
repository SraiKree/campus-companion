import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile to get roll number
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('roll_no')
      .eq('id', userId)
      .single();

    if (profile?.roll_no) {
      // Update active session to mark as logged out
      await supabaseAdmin
        .from('student_login_sessions')
        .update({
          logout_time: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Log logout activity
      await supabaseAdmin
        .from('student_activity_log')
        .insert({
          user_id: userId,
          roll_number: profile.roll_no,
          activity_type: 'logout',
          activity_details: { logout_method: 'manual' },
          ip_address: clientIP,
          user_agent: userAgent
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}