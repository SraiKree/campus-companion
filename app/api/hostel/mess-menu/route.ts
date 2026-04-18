import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DAYS_OF_WEEK } from '@/lib/hostel';

// GET /api/hostel/mess-menu
// Returns the full weekly menu, ordered Mon → Sun.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('mess_menu')
      .select('day_of_week, breakfast, lunch, snacks, dinner');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
    }

    const byDay = new Map((data ?? []).map(r => [r.day_of_week, r]));
    const ordered = DAYS_OF_WEEK.map(d =>
      byDay.get(d) ?? {
        day_of_week: d,
        breakfast: null,
        lunch: null,
        snacks: null,
        dinner: null,
      }
    );

    return NextResponse.json({ menu: ordered });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
