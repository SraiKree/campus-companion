import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

/**
 * Faculty library catalog browser. Returns book titles with current
 * availability counts and optional search.
 */
export async function GET(request: NextRequest) {
  try {
    await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    let query = supabaseAdmin
      .from('books')
      .select('id, title, author, category, isbn, publisher, year_published, edition')
      .eq('status', 'active')
      .order('title', { ascending: true })
      .limit(100);

    if (q) {
      query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`);
    }

    const { data: books, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Compute availability per book
    const ids = (books || []).map(b => b.id);
    let availability: Record<string, { total: number; available: number }> = {};
    if (ids.length > 0) {
      const { data: copies } = await supabaseAdmin
        .from('book_copies')
        .select('book_id, status')
        .in('book_id', ids);
      (copies || []).forEach((c: any) => {
        const slot = availability[c.book_id] || { total: 0, available: 0 };
        slot.total += 1;
        if (c.status === 'available') slot.available += 1;
        availability[c.book_id] = slot;
      });
    }

    const enriched = (books || []).map(b => ({
      ...b,
      total_copies: availability[b.id]?.total ?? 0,
      available_copies: availability[b.id]?.available ?? 0,
    }));

    return NextResponse.json({ books: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
