import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const rollNumber = searchParams.get('rollNumber');
    const activityType = searchParams.get('activityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseAdmin
      .from('student_activity_log')
      .select(`
        *,
        profiles!inner(name, roll_no, department)
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (rollNumber) {
      query = query.eq('roll_number', rollNumber);
    }

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('student_activity_log')
      .select('*', { count: 'exact', head: true });

    if (rollNumber) countQuery = countQuery.eq('roll_number', rollNumber);
    if (activityType) countQuery = countQuery.eq('activity_type', activityType);
    if (startDate) countQuery = countQuery.gte('timestamp', startDate);
    if (endDate) countQuery = countQuery.lte('timestamp', endDate);

    const { count } = await countQuery;

    return NextResponse.json({
      activities,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Admin activity API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}