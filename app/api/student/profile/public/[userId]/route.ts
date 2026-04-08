import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get public profile data (excluding sensitive info like email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, roll_no, department, class_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get student details from students25 if roll_no exists
    let studentDetails = null;
    if (profile.roll_no) {
      const { data: student } = await supabase
        .from('students25')
        .select('roll_number, name, department, section, semester, year')
        .eq('roll_number', profile.roll_no.trim())
        .single();
      
      studentDetails = student;
    }

    return NextResponse.json({
      profile,
      studentDetails,
    });
  } catch (error) {
    console.error('Error in public profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
