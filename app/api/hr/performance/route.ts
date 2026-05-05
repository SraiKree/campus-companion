import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateHr } from '@/lib/hr-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateHr(request);
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');

    let query = supabaseAdmin
      .from('hr_performance_reviews')
      .select('id, employee_id, review_period, rating, strengths, areas_to_improve, reviewer_name, review_date, remarks, created_at')
      .order('review_date', { ascending: false })
      .limit(200);

    if (employee_id) query = query.eq('employee_id', employee_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateHr(request);
    const body = await request.json();

    if (!body.employee_id || !body.review_period) {
      return NextResponse.json({ error: 'employee_id and review_period are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('hr_performance_reviews')
      .insert([{
        employee_id: body.employee_id,
        review_period: body.review_period,
        rating: body.rating ?? null,
        strengths: body.strengths ?? null,
        areas_to_improve: body.areas_to_improve ?? null,
        reviewer_name: body.reviewer_name ?? null,
        review_date: body.review_date ?? new Date().toISOString().slice(0, 10),
        remarks: body.remarks ?? null,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
