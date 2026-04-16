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
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, email, department, section, semester, year')
      .ilike('roll_number', cleanRollNumber)
      .single();

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
        role: 'student'
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