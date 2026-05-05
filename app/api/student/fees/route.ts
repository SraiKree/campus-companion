import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function authenticateStudent(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    throw { status: 401, message: 'Unauthorized' };
  }

  const roleFromMetadata = (user.user_metadata as any)?.role;
  const { data: roleRows } = await authClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles = (roleRows ?? []).map((r: any) => String(r?.role ?? '').toLowerCase());
  if (roleFromMetadata) roles.push(String(roleFromMetadata).toLowerCase());
  if (!roles.includes('student')) {
    throw { status: 403, message: 'Forbidden' };
  }

  return { user };
}

// GET: Fetch the current student's own payment submissions
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .select('id, amount, transaction_id, payment_date, screenshot_url, status, remarks, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fee payments fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}

// POST: Submit a new fee payment record
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateStudent(request);

    const body = await request.json();
    const { amount, transaction_id, payment_date, screenshot_url } = body;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!transaction_id?.trim()) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    if (!payment_date) {
      return NextResponse.json({ error: 'Payment date is required' }, { status: 400 });
    }
    if (!screenshot_url?.trim()) {
      return NextResponse.json({ error: 'Payment screenshot is required' }, { status: 400 });
    }

    const studentName = (user.user_metadata as any)?.name || user.email || 'Unknown';
    const studentRollNo = (user.user_metadata as any)?.roll_no || '';

    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        student_id: user.id,
        student_name: studentName,
        student_roll_number: studentRollNo,
        amount: parsedAmount,
        transaction_id: transaction_id.trim(),
        payment_date,
        screenshot_url: screenshot_url.trim(),
        status: 'Pending',
      })
      .select('id, amount, transaction_id, payment_date, screenshot_url, status, created_at')
      .single();

    if (error) {
      console.error('Fee payment insert error:', error);
      return NextResponse.json({ error: 'Failed to submit payment', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (err: any) {
    console.error('Fee payment POST error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: err?.status ?? 500 }
    );
  }
}
