import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/hostel/student/:id
// :id is the student's roll_number (case-insensitive).
// Returns 404 if the student isn't in students25 or has no current allocation.
// The UI always renders the Hostel page; absence of an allocation is shown
// as an empty state, not an access-denied error.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roll = id.trim().toUpperCase();

    if (!roll) {
      return NextResponse.json({ error: 'Roll number required' }, { status: 400 });
    }

    // 1. Look up the student
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, department, year')
      .ilike('roll_number', roll)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 2. Find current allocation
    const { data: allocation, error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .select('room_id, allocated_at')
      .eq('student_roll', student.roll_number)
      .eq('is_current', true)
      .maybeSingle();

    if (allocErr) {
      return NextResponse.json({ error: 'Failed to fetch allocation' }, { status: 500 });
    }

    if (!allocation) {
      return NextResponse.json(
        { error: 'No room allocated yet' },
        { status: 404 }
      );
    }

    // 3. Fetch room
    const { data: room, error: roomErr } = await supabaseAdmin
      .from('hostel_rooms')
      .select('id, room_no, block')
      .eq('id', allocation.room_id)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 4. Find roommates (same room, current, excluding self)
    const { data: roommateAllocs } = await supabaseAdmin
      .from('hostel_allocations')
      .select('student_roll')
      .eq('room_id', room.id)
      .eq('is_current', true)
      .neq('student_roll', student.roll_number);

    const roommateRolls = (roommateAllocs ?? []).map(r => r.student_roll);

    let roommates: Array<{
      roll_number: string;
      name: string;
      department?: string;
      year?: number;
    }> = [];

    if (roommateRolls.length > 0) {
      const { data: rmData } = await supabaseAdmin
        .from('students25')
        .select('roll_number, name, department, year')
        .in('roll_number', roommateRolls);

      roommates = (rmData ?? []).map(r => ({
        roll_number: r.roll_number,
        name: r.name,
        department: r.department,
        year: r.year,
      }));
    }

    return NextResponse.json({
      student: {
        roll_number: student.roll_number,
        name: student.name,
        room_no: room.room_no,
        block: room.block,
        roommates,
      },
    });
  } catch (err: any) {
    console.error('Hostel student API error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
