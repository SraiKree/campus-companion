import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    let query = supabase
      .from('subjects')
      .select('*')
      .order('subject_name', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    return NextResponse.json({ subjects });

  } catch (error) {
    console.error('Subjects API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}