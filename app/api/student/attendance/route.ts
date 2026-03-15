import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logActivity, ACTIVITY_TYPES } from '@/lib/activity-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentRollNumber = searchParams.get('rollNumber');
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('Attendance API called with rollNumber:', studentRollNumber);

    if (!studentRollNumber) {
      console.error('No rollNumber provided');
      return NextResponse.json({ error: 'Student roll number is required' }, { status: 400 });
    }

    // Clean the roll number
    const cleanRollNumber = studentRollNumber.trim().toUpperCase();
    console.log('Cleaned roll number:', cleanRollNumber);

    // Verify student exists - handle both trimmed and untrimmed roll numbers
    const { data: student, error: studentError } = await supabase
      .from('students25')
      .select('roll_number, name, section, department, semester')
      .or(`roll_number.eq.${cleanRollNumber},roll_number.eq.    ${cleanRollNumber}`)
      .maybeSingle();

    if (studentError) {
      console.error('Student lookup error:', studentError);
      return NextResponse.json({ error: 'Failed to fetch student data', details: studentError.message }, { status: 500 });
    }

    if (!student) {
      console.log('No student found with roll number:', studentRollNumber);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('Found student:', student.name, 'Section:', student.section);

    // Get user ID for activity logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('roll_no', student.roll_number.trim())
      .single();

    // Log attendance view activity
    if (profile?.id) {
      await logActivity({
        userId: profile.id,
        rollNumber: student.roll_number.trim(),
        activityType: ACTIVITY_TYPES.VIEW_ATTENDANCE,
        activityDetails: { 
          section: student.section,
          department: student.department 
        },
        ipAddress: clientIP,
        userAgent: userAgent
      });
    }

    // Get attendance summary using the view we created - use the actual roll_number from the student record
    const { data: attendanceSummary, error: summaryError } = await supabase
      .from('student_attendance_summary')
      .select('*')
      .eq('student_roll_number', student.roll_number); // Use the exact roll_number from DB

    if (summaryError) {
      console.error('Attendance summary error:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch attendance summary', details: summaryError.message }, { status: 500 });
    }

    console.log('Found attendance records:', attendanceSummary?.length || 0);

    // Calculate overall statistics
    let totalClasses = 0;
    let totalPresent = 0;
    const subjectWiseAttendance = attendanceSummary?.map(record => {
      totalClasses += record.total_classes;
      totalPresent += record.classes_attended;
      
      return {
        subject_name: record.subject_name,
        subject_code: record.subject_code,
        total_classes: record.total_classes,
        classes_attended: record.classes_attended,
        attendance_percentage: record.attendance_percentage
      };
    }) || [];

    const overallAttendancePercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

    // Calculate days needed to reach 75% attendance
    const targetPercentage = 75;
    let daysNeededFor75Percent = 0;
    
    if (overallAttendancePercentage < targetPercentage) {
      // Formula: (present + x) / (total + x) = 0.75
      // Solving for x: x = (0.75 * total - present) / 0.25
      daysNeededFor75Percent = Math.ceil((targetPercentage * totalClasses / 100 - totalPresent) / (1 - targetPercentage / 100));
      daysNeededFor75Percent = Math.max(0, daysNeededFor75Percent);
    }

    // Get recent attendance records for detailed view
    const { data: recentAttendance, error: recentError } = await supabase
      .rpc('get_student_attendance_by_date_range', {
        p_student_roll_number: student.roll_number, // Use the actual roll_number from DB
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
        p_end_date: new Date().toISOString().split('T')[0]
      });

    if (recentError) {
      console.error('Recent attendance error:', recentError);
      // Don't fail the entire request for this
    }

    return NextResponse.json({
      student: {
        roll_number: student.roll_number,
        name: student.name,
        section: student.section,
        department: student.department,
        semester: student.semester
      },
      overall_stats: {
        total_classes: totalClasses,
        classes_attended: totalPresent,
        attendance_percentage: Math.round(overallAttendancePercentage * 100) / 100,
        days_needed_for_75_percent: daysNeededFor75Percent
      },
      subject_wise_attendance: subjectWiseAttendance,
      recent_attendance: recentAttendance || []
    });

  } catch (error) {
    console.error('Unexpected error in attendance API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}