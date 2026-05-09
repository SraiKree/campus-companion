import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch faculty classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const weekday = searchParams.get('weekday');
    const department = searchParams.get('department');
    const section = searchParams.get('section');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('faculty_classes')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('weekday', { ascending: true })
      .order('period_start', { ascending: true });

    if (weekday) {
      query = query.eq('weekday', parseInt(weekday));
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (section) {
      query = query.eq('section', section);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    return NextResponse.json({ 
      classes,
      filters: {
        facultyId,
        weekday,
        department,
        section,
        academicYear,
        semester
      }
    });

  } catch (error) {
    console.error('Classes API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new class(es)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      facultyId,
      subjectName,
      subjectCode,
      department,
      section,
      weekday,
      periodStart,
      periodEnd,
      isLab,
      roomNumber,
      isRecurring,
      academicYear,
      semester,
      notes
    } = body;

    // Validation
    if (!facultyId || !subjectName || !subjectCode || !department || !section || !weekday || !periodStart || !academicYear || !semester) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For non-lab classes, periodEnd should equal periodStart
    const actualPeriodEnd = isLab ? periodEnd : periodStart;

    if (!actualPeriodEnd) {
      return NextResponse.json({ error: 'Period end is required for lab sessions' }, { status: 400 });
    }

    // Calculate the next occurrence of the selected weekday
    const today = new Date();
    const targetWeekday = parseInt(weekday); // 1=Monday, 2=Tuesday, etc.
    
    console.log('Today:', today.toDateString(), 'Target weekday:', targetWeekday);
    
    // Convert Sunday-based (0-6) to Monday-based (1-7) for easier calculation
    const currentWeekday = today.getDay() === 0 ? 7 : today.getDay();
    
    // Calculate the date for the target weekday in the CURRENT week
    const daysUntilTarget = targetWeekday - currentWeekday;
    
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysUntilTarget);
    
    console.log('Next occurrence calculated:', nextOccurrence.toDateString());
    
    const classesToCreate = [];

    // Use the academic year and semester from the form instead of auto-detecting
    const selectedAcademicYear = academicYear;
    const selectedSemester = semester;

    if (isRecurring) {
      // Create classes for next 8 weeks starting from the next occurrence
      console.log('Creating recurring classes for 8 weeks...');
      for (let week = 0; week < 8; week++) {
        const classDate = new Date(nextOccurrence);
        classDate.setDate(nextOccurrence.getDate() + (week * 7));

        classesToCreate.push({
          faculty_id: facultyId,
          subject_name: subjectName,
          subject_code: subjectCode,
          department,
          section,
          weekday: targetWeekday,
          period_start: parseInt(periodStart),
          period_end: parseInt(actualPeriodEnd),
          is_lab: isLab || false,
          room_number: roomNumber,
          start_date: classDate.toISOString().split('T')[0],
          end_date: null, // No end date for recurring classes
          is_recurring: true,
          academic_year: selectedAcademicYear,
          semester: selectedSemester,
          notes
        });
      }
    } else {
      // Create single persistent class that repeats every week
      console.log('Creating persistent weekly class...');
      
      classesToCreate.push({
        faculty_id: facultyId,
        subject_name: subjectName,
        subject_code: subjectCode,
        department,
        section,
        weekday: targetWeekday,
        period_start: parseInt(periodStart),
        period_end: parseInt(actualPeriodEnd),
        is_lab: isLab || false,
        room_number: roomNumber,
        start_date: nextOccurrence.toISOString().split('T')[0],
        end_date: null, // No end date - class is persistent
        is_recurring: false,
        academic_year: selectedAcademicYear,
        semester: selectedSemester,
        notes
      });
    }

    const { data: createdClasses, error } = await supabaseAdmin
      .from('faculty_classes')
      .insert(classesToCreate)
      .select();

    if (error) {
      console.error('Error creating classes:', error);
      return NextResponse.json({ error: 'Failed to create classes', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      classes: createdClasses,
      message: isRecurring 
        ? `Created ${createdClasses.length} classes for the next 8 weeks starting ${nextOccurrence.toDateString()}` 
        : `Class created and will repeat every ${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetWeekday]} starting ${nextOccurrence.toDateString()}`
    });

  } catch (error) {
    console.error('Create class API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a class
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('faculty_classes')
      .delete()
      .eq('id', classId);

    if (error) {
      console.error('Error deleting class:', error);
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Class deleted successfully' });

  } catch (error) {
    console.error('Delete class API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}