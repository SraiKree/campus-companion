import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/auth/login?email=… — used by AuthContext to hydrate the full student
// profile (department, section, semester, year, hostel info) on page reload,
// since user_metadata only carries name + roll_no.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();
    const rollNumber = searchParams.get('rollNumber')?.trim();

    if (!email && !rollNumber) {
      return NextResponse.json({ error: 'email or rollNumber required' }, { status: 400 });
    }

    let student: any = null;
    let studentError: any = null;

    {
      let q = supabaseAdmin
        .from('students25')
        .select('roll_number, name, email, department, section, semester, year, is_hosteller, hostel_status');
      q = email ? q.ilike('email', email) : q.ilike('roll_number', rollNumber!);
      const res = await q.single();
      student = res.data;
      studentError = res.error;
    }

    if (studentError) {
      let q = supabaseAdmin
        .from('students25')
        .select('roll_number, name, email, department, section, semester, year');
      q = email ? q.ilike('email', email) : q.ilike('roll_number', rollNumber!);
      const res = await q.single();
      student = res.data;
      studentError = res.error;
    }

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: student.name,
        email: student.email.trim(),
        roll_no: student.roll_number.trim(),
        department: student.department,
        section: student.section,
        semester: student.semester,
        year: student.year,
        role: 'student',
        isHosteller: Boolean(student.is_hosteller ?? false),
        hostelStatus: ((student.hostel_status as 'active' | 'left') ?? 'active'),
      },
    });
  } catch (error) {
    console.error('auth/login GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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