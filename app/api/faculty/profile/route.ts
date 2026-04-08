import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get faculty classes to derive teaching info
    const { data: classes } = await supabase
      .from('faculty_classes')
      .select('subject_name, subject_code, department, section, weekday, period_start, period_end, room_number, academic_year, semester, is_lab')
      .eq('faculty_id', user.id);

    // Get unique subjects taught
    const subjectMap = new Map<string, { name: string; code: string; departments: Set<string>; sections: Set<string> }>();
    (classes || []).forEach((c) => {
      const key = c.subject_code;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { name: c.subject_name, code: c.subject_code, departments: new Set(), sections: new Set() });
      }
      const entry = subjectMap.get(key)!;
      entry.departments.add(c.department);
      entry.sections.add(`${c.department}-${c.section}`);
    });

    const subjectsTaught = Array.from(subjectMap.values()).map((s) => ({
      name: s.name,
      code: s.code,
      departments: Array.from(s.departments),
      sections: Array.from(s.sections),
    }));

    // Count unique sections
    const uniqueSections = new Set((classes || []).map((c) => `${c.department}-${c.section}`));

    // Total classes per week
    const totalClassesPerWeek = (classes || []).length;

    // Get unique student count from attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('faculty_id', user.id);

    const uniqueStudents = new Set((attendanceData || []).map((a) => a.student_id)).size;

    // Get announcements count
    const { count: announcementsCount } = await supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('faculty_id', user.id);

    return NextResponse.json({
      profile,
      teachingInfo: {
        subjectsTaught,
        totalSections: uniqueSections.size,
        totalClassesPerWeek,
        totalStudents: uniqueStudents,
        announcementsPosted: announcementsCount || 0,
      },
      authEmail: user.email,
    });
  } catch (error) {
    console.error('Error in faculty profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
