import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { rollNumber, password } = await request.json();

    if (!rollNumber || !password) {
      return NextResponse.json({ error: 'Roll number and password are required' }, { status: 400 });
    }

    // Clean the roll number
    const cleanRollNumber = rollNumber.trim().toUpperCase();

    // Validate student exists in students25 table (exact match, case-insensitive)
    // Try with hostel columns first; fall back to the original columns if the
    // hostel migration hasn't been run yet.
    let student: any = null;
    let studentError: any = null;

    {
      const res = await supabaseAdmin
        .from('students25')
        .select('roll_number, name, email, department, section, semester, year, is_hosteller, hostel_status')
        .ilike('roll_number', cleanRollNumber)
        .single();
      student = res.data;
      studentError = res.error;
    }

    if (studentError) {
      const res = await supabaseAdmin
        .from('students25')
        .select('roll_number, name, email, department, section, semester, year')
        .ilike('roll_number', cleanRollNumber)
        .single();
      student = res.data;
      studentError = res.error;
    }

    if (studentError || !student) {
      return NextResponse.json({ error: 'Invalid roll number' }, { status: 401 });
    }

    // Validate password (currently using roll number as default password)
    if (password !== cleanRollNumber) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const studentEmail = student.email.trim();

    // Return student data + credentials for the frontend to handle Supabase auth
    return NextResponse.json({
      success: true,
      user: {
        name: student.name,
        email: studentEmail,
        roll_no: student.roll_number.trim(),
        department: student.department,
        section: student.section,
        semester: student.semester,
        year: student.year,
        role: 'student',
        isHosteller: Boolean(student.is_hosteller ?? false),
        hostelStatus: ((student.hostel_status as 'active' | 'left') ?? 'active')
      },
      credentials: {
        email: studentEmail,
        password: cleanRollNumber
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}