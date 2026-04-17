import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '9:20 AM', end: '10:20 AM' },
  2: { start: '10:20 AM', end: '11:20 AM' },
  3: { start: '11:20 AM', end: '12:20 PM' },
  4: { start: '1:10 PM', end: '2:10 PM' },
  5: { start: '2:10 PM', end: '3:10 PM' },
  6: { start: '3:10 PM', end: '4:10 PM' },
};

function getWeekday(date: Date) {
  // JS: 0 = Sunday, 6 = Saturday. App: 1 = Monday ... 6 = Saturday, 7 = Sunday.
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const weekday = getWeekday(targetDate);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('roll_no')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.roll_no) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { data: student, error: studentError } = await supabaseAdmin
      .from('students25')
      .select('department, section, semester, year, name')
      .eq('roll_number', profile.roll_no.trim())
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student details not found' }, { status: 404 });
    }

    const { data: allClasses, error: classesError } = await supabaseAdmin
      .from('faculty_classes')
      .select('*')
      .eq('department', student.department)
      .eq('section', student.section)
      .eq('weekday', weekday);

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    const current = new Date(targetDateStr);
    const activeClasses = (allClasses || []).filter((c: any) => {
      const startDate = new Date(c.start_date);
      if (current < startDate) return false;

      if (c.is_recurring) {
        const weeksDiff = Math.floor((current.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff >= 0 && weeksDiff < 8;
      }
      return true;
    });

    // Deduplicate by (subject_code, period_start) — one row per slot
    const dedup = new Map<string, any>();
    for (const c of activeClasses) {
      const key = `${c.subject_code}-${c.period_start}`;
      if (!dedup.has(key)) dedup.set(key, c);
    }
    const uniqueClasses = Array.from(dedup.values());

    const facultyIds = Array.from(new Set(uniqueClasses.map((c) => c.faculty_id).filter(Boolean)));
    const { data: facultyProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .in('id', facultyIds.length ? facultyIds : ['00000000-0000-0000-0000-000000000000']);

    const facultyMap = new Map<string, string>(
      (facultyProfiles || []).map((f: any) => [f.id, f.name])
    );

    const classIds = uniqueClasses.map((c) => c.id);
    const { data: statusRows } = await supabaseAdmin
      .from('class_status')
      .select('class_id, status, note')
      .in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('class_date', targetDateStr);

    const statusMap = new Map<string, { status: string; note: string | null }>(
      (statusRows || []).map((s: any) => [s.class_id, { status: s.status, note: s.note }])
    );

    const lectures = uniqueClasses
      .map((c: any) => {
        const startTimes = PERIOD_TIMES[c.period_start] || { start: '', end: '' };
        const endTimes = PERIOD_TIMES[c.period_end] || startTimes;
        const minutes = (c.period_end - c.period_start + 1) * 60;
        const st = statusMap.get(c.id);
        return {
          id: c.id,
          subjectName: c.subject_name,
          subjectCode: c.subject_code,
          periodStart: c.period_start,
          periodEnd: c.period_end,
          startTime: startTimes.start,
          endTime: endTimes.end,
          durationMinutes: minutes,
          facultyName: facultyMap.get(c.faculty_id) || 'TBA',
          academicYear: c.academic_year,
          semester: c.semester,
          department: c.department,
          section: c.section,
          isLab: c.is_lab,
          roomNumber: c.room_number,
          status: st?.status || 'Not Yet Updated',
          note: st?.note || null,
        };
      })
      .sort((a, b) => a.periodStart - b.periodStart);

    return NextResponse.json({
      date: targetDateStr,
      weekday,
      studentInfo: {
        name: student.name,
        department: student.department,
        section: student.section,
        year: student.year,
        semester: student.semester,
      },
      lectures,
    });
  } catch (error) {
    console.error('Academic planning API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
