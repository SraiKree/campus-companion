import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHostelAdmin } from '@/lib/hostel-auth';

// GET /api/hostel/admin/left
// Lists students whose hostel_status = 'left', with their last-known room.
export async function GET(request: NextRequest) {
  try {
    await authenticateHostelAdmin(request);

    const { data: students, error: studentsErr } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, department, hostel_left_at')
      .eq('hostel_status', 'left');

    if (studentsErr) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const rolls = students.map(s => s.roll_number);

    // Pick the most recent allocation per student (current=false by now) to show the last room.
    const { data: allocs, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .select('student_roll, room_id, vacated_at, allocated_at')
      .in('student_roll', rolls)
      .order('allocated_at', { ascending: false });

    if (allocErr) {
      return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 });
    }

    // Pick first (latest) allocation per roll
    const latestByRoll = new Map<string, { room_id: string; vacated_at: string | null }>();
    for (const a of allocs ?? []) {
      if (!latestByRoll.has(a.student_roll)) {
        latestByRoll.set(a.student_roll, { room_id: a.room_id, vacated_at: a.vacated_at });
      }
    }

    const roomIds = Array.from(new Set(Array.from(latestByRoll.values()).map(v => v.room_id)));

    const { data: rooms } = roomIds.length
      ? await supabaseAdmin
          .from('hostel_rooms')
          .select('id, room_no, block')
          .in('id', roomIds)
      : { data: [] as any[] };

    const roomsById = new Map((rooms ?? []).map(r => [r.id, r]));

    const result = students.map(s => {
      const latest = latestByRoll.get(s.roll_number);
      const room = latest ? roomsById.get(latest.room_id) : null;
      return {
        roll_number: s.roll_number,
        name: s.name,
        department: s.department,
        previous_room_no: room?.room_no ?? '—',
        previous_block: room?.block ?? '—',
        left_at: s.hostel_left_at ?? latest?.vacated_at ?? null,
      };
    });

    return NextResponse.json({ students: result });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status }
    );
  }
}
