import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const section = searchParams.get('section');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');

    if (!department || !section) {
      return NextResponse.json(
        { error: 'Department and section are required' },
        { status: 400 }
      );
    }

    // Build query with optional year/semester filtering
    let query = supabase
      .from('students25')
      .select('roll_number, name, department, section, year, semester')
      .eq('department', department)
      .eq('section', section);

    // Add year and semester filters if provided
    if (academicYear) {
      query = query.eq('year', academicYear);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data: students, error } = await query.order('roll_number');

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      students: students || [],
      count: students?.length || 0,
      filters: {
        department,
        section,
        academicYear,
        semester
      }
    });

  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}