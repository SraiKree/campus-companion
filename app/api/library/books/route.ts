import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const category = searchParams.get('category');
    const availableOnly = searchParams.get('available') === 'true';

    let query = supabaseAdmin
      .from('books')
      .select(`
        id, title, author, category, isbn, publisher, year_published, edition,
        reference_only, replacement_cost, status,
        book_copies ( barcode, status, condition, shelf_location )
      `)
      .eq('status', 'active')
      .order('title');

    if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const books = (data || []).map(b => {
      const copies = b.book_copies || [];
      const total = copies.length;
      const available = copies.filter(c => c.status === 'available' && c.condition === 'good').length;
      const issued = copies.filter(c => c.status === 'issued').length;
      return { ...b, total_copies: total, available_copies: available, issued_copies: issued };
    });

    const filtered = availableOnly ? books.filter(b => b.available_copies > 0) : books;
    return NextResponse.json({ books: filtered });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const body = await request.json();

    const title = (body.title || '').toString().trim();
    const author = (body.author || '').toString().trim();
    if (!title || !author) {
      return NextResponse.json({ error: 'title and author required' }, { status: 400 });
    }

    const { data: book, error } = await supabaseAdmin
      .from('books')
      .insert({
        title, author,
        category: body.category || 'textbook',
        isbn: body.isbn || null,
        publisher: body.publisher || null,
        year_published: body.year_published || null,
        edition: body.edition || null,
        reference_only: !!body.reference_only,
        replacement_cost: Number(body.replacement_cost || 0),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Optional: add initial copies if barcodes provided
    if (Array.isArray(body.barcodes) && body.barcodes.length) {
      const rows = body.barcodes
        .filter((b: string) => typeof b === 'string' && b.trim())
        .map((barcode: string) => ({
          barcode: barcode.trim(),
          book_id: book.id,
          shelf_location: body.shelf_location || null,
        }));
      if (rows.length) {
        const { error: copyErr } = await supabaseAdmin.from('book_copies').insert(rows);
        if (copyErr) {
          return NextResponse.json({
            book,
            copiesError: copyErr.code === '23505' ? 'One or more barcodes already exist.' : copyErr.message,
          }, { status: 201 });
        }
      }
    }

    return NextResponse.json({ book }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['title', 'author', 'category', 'isbn', 'publisher', 'year_published', 'edition', 'reference_only', 'replacement_cost', 'status']) {
      if (k in body) updates[k] = body[k];
    }

    const { data, error } = await supabaseAdmin
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ book: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { count } = await supabaseAdmin
      .from('book_copies')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', id)
      .eq('status', 'issued');

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `${count} copies are currently issued. Wait for returns before deleting.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('books').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
