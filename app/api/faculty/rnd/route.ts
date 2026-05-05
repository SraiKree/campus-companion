import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateFaculty } from '@/lib/faculty-auth';

const TABLES = {
  publication: 'faculty_publications',
  patent: 'faculty_patents',
  project: 'faculty_projects',
} as const;
type Kind = keyof typeof TABLES;

function pickTable(kind: string | null): string | null {
  if (!kind || !(kind in TABLES)) return null;
  return TABLES[kind as Kind];
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);

    const [pubs, patents, projects] = await Promise.all([
      supabaseAdmin.from('faculty_publications').select('*').eq('faculty_id', user.id).order('year', { ascending: false, nullsFirst: false }),
      supabaseAdmin.from('faculty_patents').select('*').eq('faculty_id', user.id).order('filing_date', { ascending: false, nullsFirst: false }),
      supabaseAdmin.from('faculty_projects').select('*').eq('faculty_id', user.id).order('start_date', { ascending: false, nullsFirst: false }),
    ]);

    return NextResponse.json({
      publications: pubs.data || [],
      patents: patents.data || [],
      projects: projects.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const body = await request.json();
    const table = pickTable(body.kind);
    if (!table) return NextResponse.json({ error: 'kind must be publication | patent | project' }, { status: 400 });
    if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const { kind: _, ...payload } = body;
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([{ ...payload, faculty_id: user.id }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ record: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateFaculty(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const table = pickTable(searchParams.get('kind'));
    if (!id || !table) return NextResponse.json({ error: 'id and kind are required' }, { status: 400 });

    const { error } = await supabaseAdmin.from(table).delete().eq('id', id).eq('faculty_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
