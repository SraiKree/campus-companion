import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateLibrary } from '@/lib/library-auth';

export async function POST(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const body = await request.json();
    const book_id = body.book_id;
    const barcode = (body.barcode || '').toString().trim();
    if (!book_id || !barcode) {
      return NextResponse.json({ error: 'book_id and barcode required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('book_copies')
      .insert({
        barcode,
        book_id,
        shelf_location: body.shelf_location || null,
        condition: body.condition || 'good',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Barcode already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ copy: data }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    if (!barcode) return NextResponse.json({ error: 'barcode required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ['shelf_location', 'condition']) {
      if (k in body) updates[k] = body[k];
    }

    const { data, error } = await supabaseAdmin
      .from('book_copies')
      .update(updates)
      .eq('barcode', barcode)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ copy: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateLibrary(request);
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    if (!barcode) return NextResponse.json({ error: 'barcode required' }, { status: 400 });

    const { data: copy } = await supabaseAdmin
      .from('book_copies')
      .select('status')
      .eq('barcode', barcode)
      .single();

    if (copy?.status === 'issued') {
      return NextResponse.json({ error: 'Copy is currently issued. Return it first.' }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('book_copies').delete().eq('barcode', barcode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
