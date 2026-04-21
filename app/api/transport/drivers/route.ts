import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { data, error } = await supabaseAdmin
      .from('transport_drivers')
      .select('*, buses:buses!buses_driver_id_fkey(id, bus_number)')
      .order('full_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ drivers: data || [] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const body = await request.json();

    const full_name = (body.full_name || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const license_number = (body.license_number || '').toString().trim();
    const license_expiry = body.license_expiry;

    if (!full_name || !phone || !license_number || !license_expiry) {
      return NextResponse.json(
        { error: 'full_name, phone, license_number, license_expiry required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('transport_drivers')
      .insert({
        full_name,
        phone,
        alternate_phone: body.alternate_phone || null,
        license_number,
        license_expiry,
        address: body.address || null,
        photo_url: body.photo_url || null,
        joining_date: body.joining_date || new Date().toISOString().slice(0, 10),
        status: body.status || 'available',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'License number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ driver: data }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of [
      'full_name', 'phone', 'alternate_phone', 'license_number',
      'license_expiry', 'address', 'photo_url', 'joining_date', 'status',
    ]) {
      if (k in body) updates[k] = body[k];
    }

    const { data, error } = await supabaseAdmin
      .from('transport_drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ driver: data });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authenticateTransport(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { count } = await supabaseAdmin
      .from('buses')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', id);

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'Driver is still assigned to a bus. Unassign first.' },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('transport_drivers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: e?.status ?? 500 });
  }
}
