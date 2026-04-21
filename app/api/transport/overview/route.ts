import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateTransport } from '@/lib/transport-auth';

export async function GET(request: NextRequest) {
  try {
    await authenticateTransport(request);

    const [buses, routes, stops, assignments, fees, expiringDrivers] = await Promise.all([
      supabaseAdmin.from('buses').select('id, status, capacity'),
      supabaseAdmin.from('transport_routes').select('id, status'),
      supabaseAdmin.from('transport_route_stops').select('id'),
      supabaseAdmin.from('transport_assignments').select('id, status, bus_id'),
      supabaseAdmin.from('transport_fees').select('amount, status, due_date'),
      supabaseAdmin
        .from('transport_drivers')
        .select('id, full_name, license_expiry')
        .lte('license_expiry', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
        .order('license_expiry', { ascending: true })
        .limit(5),
    ]);

    const busList = buses.data || [];
    const routeList = routes.data || [];
    const assignList = assignments.data || [];
    const feeList = fees.data || [];
    const today = new Date().toISOString().slice(0, 10);

    const totalCapacity = busList
      .filter(b => b.status === 'active')
      .reduce((sum, b) => sum + (b.capacity || 0), 0);
    const activeAssigned = assignList.filter(a => a.status === 'active').length;

    const collected = feeList
      .filter(f => f.status === 'paid')
      .reduce((s, f) => s + Number(f.amount || 0), 0);
    const pending = feeList
      .filter(f => f.status === 'pending' || f.status === 'partial')
      .reduce((s, f) => s + Number(f.amount || 0), 0);
    const overdue = feeList
      .filter(f => f.status === 'overdue' || (f.status === 'pending' && f.due_date < today))
      .reduce((s, f) => s + Number(f.amount || 0), 0);

    return NextResponse.json({
      fleet: {
        total: busList.length,
        active: busList.filter(b => b.status === 'active').length,
        inactive: busList.filter(b => b.status === 'inactive').length,
        maintenance: busList.filter(b => b.status === 'maintenance').length,
      },
      routes: {
        total: routeList.length,
        active: routeList.filter(r => r.status === 'active').length,
        stops: (stops.data || []).length,
      },
      coverage: {
        assigned: activeAssigned,
        capacity: totalCapacity,
        seatsRemaining: Math.max(totalCapacity - activeAssigned, 0),
      },
      fees: {
        collected,
        pending,
        overdue,
        total: collected + pending + overdue,
      },
      attention: {
        licensesExpiringSoon: expiringDrivers.data || [],
      },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e?.message ?? 'Internal server error' },
      { status: e?.status ?? 500 }
    );
  }
}
