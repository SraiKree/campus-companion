import { NextRequest, NextResponse } from 'next/server';
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
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const dateParam = searchParams.get('date');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    const targetDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    const targetDateStr = dateParam || (() => {
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();
    const weekday = getWeekday(targetDate);

    const { data: classes, error: classesError } = await supabaseAdmin
      .from('faculty_classes')
      .select('*')
      .eq('faculty_id', facultyId)
      .eq('weekday', weekday);

    if (classesError) {
      console.error('Error fetching faculty classes:', classesError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    const current = new Date(targetDateStr);
    const activeClasses = (classes || []).filter((c: any) => {
      const startDate = new Date(c.start_date);
      if (current < startDate) return false;
      if (c.is_recurring) {
        const weeksDiff = Math.floor((current.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff >= 0 && weeksDiff < 8;
      }
      return true;
    });

    const dedup = new Map<string, any>();
    for (const c of activeClasses) {
      const key = `${c.subject_code}-${c.period_start}-${c.department}-${c.section}`;
      if (!dedup.has(key)) dedup.set(key, c);
    }
    const uniqueClasses = Array.from(dedup.values());

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

    return NextResponse.json({ date: targetDateStr, weekday, lectures });
  } catch (error) {
    console.error('Faculty academic planning GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facultyId, classId, date, status, note } = body;

    if (!facultyId || !classId || !date || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['Scheduled', 'No Class'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: owned, error: ownerError } = await supabaseAdmin
      .from('faculty_classes')
      .select('id, faculty_id')
      .eq('id', classId)
      .single();

    if (ownerError || !owned) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    if (owned.faculty_id !== facultyId) {
      return NextResponse.json({ error: 'You can only update your own classes' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('class_status')
      .upsert(
        {
          class_id: classId,
          faculty_id: facultyId,
          class_date: date,
          status,
          note: note || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'class_id,class_date' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting class status:', error);
      return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, statusRow: data });
  } catch (error) {
    console.error('Faculty academic planning POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
