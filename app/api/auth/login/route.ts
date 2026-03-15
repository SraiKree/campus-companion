import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, createOrGetAuthUser } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { rollNumber, password } = await request.json();
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!rollNumber || !password) {
      return NextResponse.json({ error: 'Roll number and password are required' }, { status: 400 });
    }

    // Clean the roll number
    const cleanRollNumber = rollNumber.trim().toUpperCase();
    console.log('Login attempt for roll number:', cleanRollNumber, 'from IP:', clientIP);

    // Validate student exists in students25 table
    const { data: students, error: studentError } = await supabase
      .from('students25')
      .select('roll_number, name, email, department, section, semester, year')
      .ilike('roll_number', `%${cleanRollNumber}%`)
      .limit(1);

    if (studentError) {
      console.error('Student lookup error:', studentError);
      return NextResponse.json({ error: 'Failed to verify student' }, { status: 500 });
    }

    const student = students && students.length > 0 ? students[0] : null;

    if (!student) {
      console.log('No student found for roll number:', cleanRollNumber);
      
      // Log failed login attempt
      await supabaseAdmin
        .from('student_activity_log')
        .insert({
          roll_number: cleanRollNumber,
          activity_type: 'failed_login',
          activity_details: { reason: 'invalid_roll_number' },
          ip_address: clientIP,
          user_agent: userAgent
        });

      return NextResponse.json({ error: 'Invalid roll number' }, { status: 401 });
    }

    // Validate password (currently using roll number as password)
    if (password !== cleanRollNumber) {
      console.log('Password mismatch for student:', student.name);
      
      // Log failed login attempt
      await supabaseAdmin
        .from('student_activity_log')
        .insert({
          roll_number: student.roll_number.trim(),
          activity_type: 'failed_login',
          activity_details: { reason: 'invalid_password' },
          ip_address: clientIP,
          user_agent: userAgent
        });

      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    console.log('Credentials validated for student:', student.name);

    // Create or get Supabase auth user
    const studentEmail = student.email.trim();
    const { user: authUser, isNew } = await createOrGetAuthUser(
      studentEmail,
      cleanRollNumber, // Using roll number as password for now
      {
        name: student.name,
        roll_no: student.roll_number.trim(),
        department: student.department,
        section: student.section,
        semester: student.semester,
        year: student.year,
        role: 'student'
      }
    );

    if (!authUser) {
      throw new Error('Failed to create/get auth user');
    }

    console.log('Auth user created/retrieved:', authUser.id, isNew ? '(new)' : '(existing)');

    // Upsert user profile
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.id,
        name: student.name,
        email: studentEmail,
        roll_no: student.roll_number.trim(),
        department: student.department,
        class_name: student.section,
        created_at: new Date().toISOString()
      });

    // Upsert user role
    await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authUser.id,
        role: 'student'
      });

    // Create login session record
    const { data: sessionRecord } = await supabaseAdmin
      .from('student_login_sessions')
      .insert({
        user_id: authUser.id,
        roll_number: student.roll_number.trim(),
        ip_address: clientIP,
        user_agent: userAgent,
        is_active: true
      })
      .select()
      .single();

    // Log successful login activity
    await supabaseAdmin
      .from('student_activity_log')
      .insert({
        user_id: authUser.id,
        roll_number: student.roll_number.trim(),
        activity_type: 'login',
        activity_details: { 
          session_id: sessionRecord?.id,
          is_new_user: isNew,
          login_method: 'roll_number'
        },
        ip_address: clientIP,
        user_agent: userAgent
      });

    // Ensure user password is set correctly for future logins
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: cleanRollNumber
    });

    console.log('Login successful for:', student.name);

    // Return success with user data - let the frontend handle Supabase auth
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        name: student.name,
        email: studentEmail,
        roll_no: student.roll_number.trim(),
        department: student.department,
        section: student.section,
        semester: student.semester,
        year: student.year,
        role: 'student'
      },
      // Return credentials for frontend to use
      credentials: {
        email: studentEmail,
        password: cleanRollNumber
      },
      session_id: sessionRecord?.id
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}