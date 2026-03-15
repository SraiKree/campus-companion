import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get total registered students (with auth accounts)
    const { count: totalRegistered } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('roll_no', 'is', null);

    // Get active sessions (logged in now)
    const { count: activeSessions } = await supabaseAdmin
      .from('student_login_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get today's logins
    const today = new Date().toISOString().split('T')[0];
    const { count: todayLogins } = await supabaseAdmin
      .from('student_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'login')
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .lt('timestamp', `${today}T23:59:59.999Z`);

    // Get failed login attempts today
    const { count: failedLogins } = await supabaseAdmin
      .from('student_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'failed_login')
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .lt('timestamp', `${today}T23:59:59.999Z`);

    // Get most active students (by activity count)
    const { data: mostActive } = await supabaseAdmin
      .from('student_activity_log')
      .select(`
        roll_number,
        profiles!inner(name, department),
        count:activity_type.count()
      `)
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .group('roll_number, profiles.name, profiles.department')
      .order('count', { ascending: false })
      .limit(10);

    // Get activity breakdown by type
    const { data: activityBreakdown } = await supabaseAdmin
      .from('student_activity_log')
      .select('activity_type, count:activity_type.count()')
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .group('activity_type')
      .order('count', { ascending: false });

    return NextResponse.json({
      overview: {
        totalRegistered,
        activeSessions,
        todayLogins,
        failedLogins
      },
      mostActive,
      activityBreakdown,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}