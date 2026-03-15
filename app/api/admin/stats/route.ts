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

    // Get most active students using raw SQL for proper grouping
    const { data: mostActive } = await supabaseAdmin.rpc('get_most_active_students', {
      target_date: today
    }).limit(10);

    // Get activity breakdown using raw SQL for proper grouping
    const { data: activityBreakdown } = await supabaseAdmin.rpc('get_activity_breakdown', {
      target_date: today
    });

    return NextResponse.json({
      overview: {
        totalRegistered: totalRegistered || 0,
        activeSessions: activeSessions || 0,
        todayLogins: todayLogins || 0,
        failedLogins: failedLogins || 0
      },
      mostActive: mostActive || [],
      activityBreakdown: activityBreakdown || [],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin stats API error:', error);
    
    // Fallback to basic stats if RPC functions don't exist
    return NextResponse.json({
      overview: {
        totalRegistered: 0,
        activeSessions: 0,
        todayLogins: 0,
        failedLogins: 0
      },
      mostActive: [],
      activityBreakdown: [],
      generatedAt: new Date().toISOString(),
      note: 'Using fallback data - database functions may need to be created'
    });
  }
}