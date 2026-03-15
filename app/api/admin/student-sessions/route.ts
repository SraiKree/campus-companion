import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const rollNumber = searchParams.get('rollNumber');

    let query = supabaseAdmin
      .from('student_login_sessions')
      .select(`
        *,
        profiles!inner(name, roll_no, department)
      `)
      .order('login_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (rollNumber) {
      query = query.eq('roll_number', rollNumber);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('student_login_sessions')
      .select('*', { count: 'exact', head: true });

    if (rollNumber) {
      countQuery = countQuery.eq('roll_number', rollNumber);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      sessions,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Admin sessions API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}