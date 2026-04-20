import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateAdmin } from '@/lib/admin-auth';

const ALLOWED_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Issued'] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

const BUCKET = 'certificates';

async function notifyStudent(userId: string | null, title: string, message: string) {
  if (!userId) return;
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    target_role: 'student',
    title,
    message,
    priority: 'medium',
  });
}

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    if (id) {
      const [reqRes, histRes] = await Promise.all([
        supabaseAdmin.from('certificate_requests')
          .select('id, student_id, student_name, student_roll_number, certificate_type, purpose, additional_details, required_by, status, remarks, signed_pdf_url, reviewer_id, reviewed_at, approved_by, approved_at, issued_at, created_at, updated_at')
          .eq('id', id).single(),
        supabaseAdmin.from('certificate_status_history')
          .select('id, from_status, to_status, changed_by, remarks, created_at')
          .eq('request_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (reqRes.error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ request: reqRes.data, history: histRes.data || [] });
    }

    let query = supabaseAdmin
      .from('certificate_requests')
      .select('id, student_id, student_name, student_roll_number, certificate_type, purpose, required_by, status, remarks, signed_pdf_url, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateAdmin(request);
    const body = await request.json();
    const id = body?.id?.toString();
    const status = body?.status as Status;
    const remarks = body?.remarks?.toString().trim() || null;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (!status || !(ALLOWED_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }

    const patch: Record<string, any> = {
      status,
      remarks,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (status === 'Approved') {
      patch.approved_by = user.id;
      patch.approved_at = new Date().toISOString();
    }
    if (status === 'Issued') {
      patch.issued_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('certificate_requests')
      .update(patch)
      .eq('id', id)
      .select('id, student_id, certificate_type, status')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Update failed', details: error?.message }, { status: 500 });
    }

    const verb: Record<Status, string> = {
      'Pending': 'received',
      'Under Review': 'under review',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Issued': 'issued',
    };
    await notifyStudent(
      data.student_id,
      `Certificate ${verb[status]}`,
      `Your ${data.certificate_type} request is now ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`
    );

    return NextResponse.json({ request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}

// POST (multipart/form-data) — upload signed PDF, transitions to 'Issued'
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateAdmin(request);
    const form = await request.formData();
    const id = form.get('id')?.toString();
    const remarks = form.get('remarks')?.toString().trim() || null;
    const file = form.get('file');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 });

    const { data: existing, error: exErr } = await supabaseAdmin
      .from('certificate_requests')
      .select('id, student_id, student_roll_number, certificate_type')
      .eq('id', id)
      .single();
    if (exErr || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${existing.student_roll_number || 'unknown'}/${existing.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type || 'application/pdf', upsert: true });
    if (upErr) return NextResponse.json({ error: 'Upload failed', details: upErr.message }, { status: 500 });

    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);

    const { error: updErr } = await supabaseAdmin
      .from('certificate_requests')
      .update({
        status: 'Issued',
        signed_pdf_url: signed?.signedUrl ?? null,
        remarks,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updErr) return NextResponse.json({ error: 'Update failed', details: updErr.message }, { status: 500 });

    await notifyStudent(
      existing.student_id,
      'Certificate issued',
      `Your ${existing.certificate_type} has been issued. Download link available in your portal.`
    );

    return NextResponse.json({ success: true, url: signed?.signedUrl ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: err?.status ?? 500 });
  }
}
