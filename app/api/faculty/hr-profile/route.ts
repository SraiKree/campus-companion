import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Returns the HR record for the currently signed-in faculty user.
 * Lookup order: user_id link -> email match. Returns 404 if no
 * record exists yet (HR has not onboarded the faculty).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { data: employee } = await supabaseAdmin
      .from('hr_employees')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!employee && user.email) {
      const res = await supabaseAdmin
        .from('hr_employees')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();
      employee = res.data;

      // Backfill the user_id link for next time
      if (employee && !employee.user_id) {
        await supabaseAdmin
          .from('hr_employees')
          .update({ user_id: user.id })
          .eq('id', employee.id);
      }
    }

    if (!employee) {
      return NextResponse.json({ error: 'No HR record found for this account.' }, { status: 404 });
    }

    const [docsRes, reviewsRes] = await Promise.all([
      supabaseAdmin
        .from('hr_documents')
        .select('id, doc_type, title, file_url, uploaded_at')
        .eq('employee_id', employee.id)
        .order('uploaded_at', { ascending: false }),
      supabaseAdmin
        .from('hr_performance_reviews')
        .select('id, review_period, rating, strengths, areas_to_improve, reviewer_name, review_date, remarks')
        .eq('employee_id', employee.id)
        .order('review_date', { ascending: false }),
    ]);

    return NextResponse.json({
      employee,
      documents: docsRes.data || [],
      performance_reviews: reviewsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
