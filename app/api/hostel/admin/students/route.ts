import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHostelAdmin } from '@/lib/hostel-auth';

// GET /api/hostel/admin/students
// Lists all active hostel students with their current room details.
export async function GET(request: NextRequest) {
  try {
    await authenticateHostelAdmin(request);

    // 1. All current allocations
    const { data: allocs, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .select('student_roll, room_id, allocated_at')
      .eq('is_current', true)
      .order('allocated_at', { ascending: false });

    if (allocErr) {
      return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 });
    }

    if (!allocs || allocs.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const rolls = allocs.map(a => a.student_roll);
    const roomIds = Array.from(new Set(allocs.map(a => a.room_id)));

    // 2. Fetch students (only those still active hostellers)
    const { data: students, error: studentsErr } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, department, year, is_hosteller, hostel_status')
      .in('roll_number', rolls);

    if (studentsErr) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // 3. Fetch rooms
    const { data: rooms, error: roomsErr } = await supabaseAdmin
      .from('hostel_rooms')
      .select('id, room_no, block')
      .in('id', roomIds);

    if (roomsErr) {
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }

    const studentsByRoll = new Map(
      (students ?? []).map(s => [s.roll_number, s])
    );
    const roomsById = new Map((rooms ?? []).map(r => [r.id, r]));

    const result = allocs
      .map(a => {
        const s = studentsByRoll.get(a.student_roll);
        const r = roomsById.get(a.room_id);
        if (!s || !r) return null;
        if (!s.is_hosteller || s.hostel_status !== 'active') return null;
        return {
          roll_number: s.roll_number,
          name: s.name,
          department: s.department,
          year: s.year,
          room_no: r.room_no,
          block: r.block,
          allocated_at: a.allocated_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ students: result });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status }
    );
  }
}
