import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface AttendanceRecord {
  student_roll_number: string;
  status: 'present' | 'absent';
}

export async function POST(request: NextRequest) {
  try {
    const { classId, facultyId, date, academicYear, semester, attendance } = await request.json();

    if (!classId || !facultyId || !date || !academicYear || !semester || !attendance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, get the faculty class details to find the corresponding timetable entry
    const { data: facultyClass, error: classError } = await supabaseAdmin
      .from('faculty_classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError || !facultyClass) {
      console.error('Error fetching faculty class:', classError);
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Find or create corresponding timetable entry
    let timetableId;
    
    // First check if a timetable entry exists for this class
    const { data: existingTimetable, error: timetableSearchError } = await supabaseAdmin
      .from('timetable')
      .select('id')
      .eq('section_name', `${facultyClass.department}-${facultyClass.section}`)
      .eq('weekday', facultyClass.weekday)
      .eq('period_number', facultyClass.period_start)
      .single();

    if (existingTimetable) {
      timetableId = existingTimetable.id;
    } else {
      // Create a new timetable entry
      // First, find or create subject
      let subjectId;
      const { data: existingSubject } = await supabaseAdmin
        .from('subjects')
        .select('id')
        .eq('subject_code', facultyClass.subject_code)
        .eq('department', facultyClass.department)
        .single();

      if (existingSubject) {
        subjectId = existingSubject.id;
      } else {
        const { data: newSubject, error: subjectError } = await supabaseAdmin
          .from('subjects')
          .insert({
            department: facultyClass.department,
            semester: 3, // Default semester
            subject_name: facultyClass.subject_name,
            subject_code: facultyClass.subject_code
          })
          .select('id')
          .single();

        if (subjectError) {
          console.error('Error creating subject:', subjectError);
          return NextResponse.json(
            { error: 'Failed to create subject' },
            { status: 500 }
          );
        }
        subjectId = newSubject.id;
      }

      // Find or create faculty entry
      let facultyDbId;
      const { data: existingFaculty } = await supabaseAdmin
        .from('faculty')
        .select('id')
        .eq('email', 'keertan.k@gmail.com') // Use the faculty email
        .single();

      if (existingFaculty) {
        facultyDbId = existingFaculty.id;
      } else {
        const { data: newFaculty, error: facultyError } = await supabaseAdmin
          .from('faculty')
          .insert({
            name: 'Keertan Kuppili',
            email: 'keertan.k@gmail.com',
            department: facultyClass.department
          })
          .select('id')
          .single();

        if (facultyError) {
          console.error('Error creating faculty:', facultyError);
          return NextResponse.json(
            { error: 'Failed to create faculty' },
            { status: 500 }
          );
        }
        facultyDbId = newFaculty.id;
      }

      // Create timetable entry
      const { data: newTimetable, error: timetableError } = await supabaseAdmin
        .from('timetable')
        .insert({
          section_name: `${facultyClass.department}-${facultyClass.section}`,
          subject_id: subjectId,
          faculty_id: facultyDbId,
          weekday: facultyClass.weekday,
          period_number: facultyClass.period_start,
          academic_year: academicYear,
          semester: semester
        })
        .select('id')
        .single();

      if (timetableError) {
        console.error('Error creating timetable:', timetableError);
        return NextResponse.json(
          { error: 'Failed to create timetable entry' },
          { status: 500 }
        );
      }
      timetableId = newTimetable.id;
    }

    // Create or get attendance session
    let sessionId;
    const { data: existingSession } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id')
      .eq('timetable_id', timetableId)
      .eq('date', date)
      .single();

    if (existingSession) {
      sessionId = existingSession.id;
      
      // Delete existing attendance records for this session
      await supabaseAdmin
        .from('attendance_records')
        .delete()
        .eq('session_id', sessionId);
    } else {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('attendance_sessions')
        .insert({
          timetable_id: timetableId,
          date: date,
          academic_year: academicYear,
          semester: semester
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return NextResponse.json(
          { error: 'Failed to create attendance session' },
          { status: 500 }
        );
      }
      sessionId = newSession.id;
    }

    // Insert attendance records
    const attendanceRecords = attendance.map((record: AttendanceRecord) => ({
      session_id: sessionId,
      student_roll_number: record.student_roll_number,
      status: record.status
    }));

    const { error: attendanceError } = await supabaseAdmin
      .from('attendance_records')
      .insert(attendanceRecords);

    if (attendanceError) {
      console.error('Error inserting attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to save attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Attendance saved successfully',
      sessionId,
      recordsCount: attendanceRecords.length
    });

  } catch (error) {
    console.error('Mark attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}