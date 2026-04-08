import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to find roll number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('roll_no')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.roll_no) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get student details from students25 table
    const { data: student, error: studentError } = await supabase
      .from('students25')
      .select('department, section, semester, year')
      .eq('roll_number', profile.roll_no.trim())
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student details not found' }, { status: 404 });
    }

    // Get courses from faculty_classes matching student's department and section
    const { data: courses, error: coursesError } = await supabase
      .from('faculty_classes')
      .select('*')
      .eq('department', student.department)
      .eq('section', student.section)
      .order('subject_name');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // Get faculty names for the courses
    const facultyIds = courses?.map((c: any) => c.faculty_id).filter(Boolean) || [];
    const { data: facultyProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', facultyIds);

    const facultyMap = new Map(facultyProfiles?.map((f: any) => [f.id, f.name]) || []);

    // Group courses by subject to avoid duplicates
    const uniqueCourses = new Map();
    
    courses?.forEach((course: any) => {
      const key = `${course.subject_code}-${course.subject_name}`;
      if (!uniqueCourses.has(key)) {
        uniqueCourses.set(key, {
          id: course.id,
          code: course.subject_code,
          name: course.subject_name,
          instructor: facultyMap.get(course.faculty_id) || 'TBA',
          department: course.department,
          section: course.section,
          semester: course.semester,
          academicYear: course.academic_year,
          room: course.room_number,
          isLab: course.is_lab,
        });
      }
    });

    const coursesList = Array.from(uniqueCourses.values());

    return NextResponse.json({
      courses: coursesList,
      studentInfo: {
        department: student.department,
        section: student.section,
        semester: student.semester,
        year: student.year,
      },
    });
  } catch (error) {
    console.error('Error in courses API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
