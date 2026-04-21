import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) return NextResponse.json({ students: [] });

    const { data, error } = await supabaseAdmin
      .from('students25')
      .select('roll_number, name, class_name, department')
      .or(`roll_number.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ students: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
