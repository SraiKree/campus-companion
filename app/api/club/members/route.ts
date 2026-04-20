import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClub } from '@/lib/club-auth';

export async function GET(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const { data, error } = await supabaseAdmin
      .from('club_members')
      .select('id, roll_number, student_name, added_at')
      .eq('club_id', club.id)
      .order('added_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    return NextResponse.json({ members: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const body = await request.json();
    const roll = (body?.roll_number || '').toString().trim().toUpperCase();
    if (!roll) return NextResponse.json({ error: 'roll_number is required' }, { status: 400 });

    const { data: student } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name')
      .ilike('roll_number', roll)
      .single();

    if (!student) return NextResponse.json({ error: 'No student with that roll number' }, { status: 404 });

    const { data: existing } = await supabaseAdmin
      .from('club_members')
      .select('id')
      .eq('club_id', club.id)
      .eq('roll_number', student.roll_number)
      .maybeSingle();

    if (existing) return NextResponse.json({ error: 'Student is already a member' }, { status: 409 });

    const { data, error } = await supabaseAdmin
      .from('club_members')
      .insert({ club_id: club.id, roll_number: student.roll_number, student_name: student.name })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { club } = await authenticateClub(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('club_members')
      .select('id, club_id')
      .eq('id', id)
      .single();

    if (!existing || existing.club_id !== club.id) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('club_members')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
