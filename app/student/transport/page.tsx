'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bus, MapPin, Clock, Phone, User, Route as RouteIcon, Search, IndianRupee,
  CheckCircle2, AlertCircle, Info, Users, Wrench,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StudentLayout from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/input';

interface RouteLite { id: string; name: string; fee_amount: number; distance_km: number | null }
interface DriverLite { id: string; full_name: string; phone: string }
interface FleetBus {
  id: string;
  bus_number: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  route_id: string | null;
  driver_id: string | null;
  transport_routes: RouteLite | null;
  transport_drivers: DriverLite | null;
  assigned_count: number;
  seats_remaining: number;
}
interface Stop {
  id: string;
  stop_name: string;
  landmark: string | null;
  pickup_time: string;
  stop_order: number;
}
interface RouteWithStops {
  id: string;
  name: string;
  fee_amount: number;
  distance_km: number | null;
  status: 'active' | 'suspended';
  transport_route_stops: Stop[];
}
interface MyAssignment {
  id: string;
  student_roll: string;
  student_name: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  buses: {
    id: string;
    bus_number: string;
    capacity: number;
    status: string;
    notes: string | null;
    transport_drivers: DriverLite | null;
  } | null;
  transport_routes: RouteLite | null;
  transport_route_stops: Stop | null;
}
interface FeeRow {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'partial' | 'waived' | 'overdue';
  payment_ref: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  active: { bg: 'rgba(34,197,94,0.12)', fg: '#16a34a' },
  inactive: { bg: 'rgba(107,114,128,0.12)', fg: '#6b7280' },
  maintenance: { bg: 'rgba(234,179,8,0.15)', fg: '#ca8a04' },
};

const formatTime = (t: string) => {
  // HH:MM:SS → 7:45 AM
  const [hStr, m] = t.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m} ${suffix}`;
};

export default function StudentTransportPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fleet, setFleet] = useState<FleetBus[]>([]);
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [myAssignment, setMyAssignment] = useState<MyAssignment | null>(null);
  const [myFees, setMyFees] = useState<FeeRow[]>([]);

  const [query, setQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [tab, setTab] = useState<'fleet' | 'routes'>('fleet');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('No active session');

        const res = await fetch('/api/student/transport', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load transport data');

        setFleet(data.fleet || []);
        setRoutes(data.routes || []);
        setMyAssignment(data.myAssignment || null);
        setMyFees(data.myFees || []);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user]);

  const filteredFleet = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fleet.filter(b => {
      if (routeFilter !== 'all' && b.route_id !== routeFilter) return false;
      if (!q) return true;
      return (
        b.bus_number.toLowerCase().includes(q) ||
        b.transport_routes?.name.toLowerCase().includes(q) ||
        b.transport_drivers?.full_name.toLowerCase().includes(q)
      );
    });
  }, [fleet, query, routeFilter]);

  const pendingFee = myFees.find(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partial');

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e05252]/10 flex items-center justify-center">
            <Bus className="w-6 h-6 text-[#e05252]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
              My Transport
            </h1>
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              Campus fleet of {fleet.length} {fleet.length === 1 ? 'bus' : 'buses'}, route timings, and your assignment
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
          </div>
        )}

        {error && !loading && (
          <div
            className="rounded-2xl border p-4 text-sm flex items-start gap-3"
            style={{ borderColor: 'rgba(220,38,38,0.3)', backgroundColor: 'rgba(220,38,38,0.05)', color: '#dc2626' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* My Assignment */}
            {myAssignment ? (
              <div
                className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                  <h2 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    Your Current Assignment
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoCard
                    icon={<Bus className="w-5 h-5 text-[#e05252]" />}
                    label="Bus Number"
                    value={myAssignment.buses?.bus_number || '—'}
                    sub={myAssignment.buses?.capacity ? `${myAssignment.buses.capacity} seat capacity` : undefined}
                  />
                  <InfoCard
                    icon={<RouteIcon className="w-5 h-5 text-[#e05252]" />}
                    label="Route"
                    value={myAssignment.transport_routes?.name || '—'}
                    sub={
                      myAssignment.transport_routes?.distance_km
                        ? `${myAssignment.transport_routes.distance_km} km from campus`
                        : undefined
                    }
                  />
                  <InfoCard
                    icon={<MapPin className="w-5 h-5 text-[#e05252]" />}
                    label="Boarding Stop"
                    value={myAssignment.transport_route_stops?.stop_name || '—'}
                    sub={
                      myAssignment.transport_route_stops?.pickup_time
                        ? `Pickup at ${formatTime(myAssignment.transport_route_stops.pickup_time)}`
                        : undefined
                    }
                  />
                </div>

                {myAssignment.buses?.transport_drivers && (
                  <div
                    className="mt-4 rounded-xl border p-4 flex items-center gap-4"
                    style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: 'var(--ch-accent)' }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                        {myAssignment.buses.transport_drivers.full_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        Driver · Bus {myAssignment.buses.bus_number}
                      </p>
                    </div>
                    <a
                      href={`tel:${myAssignment.buses.transport_drivers.phone}`}
                      className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: 'var(--ch-border)',
                        color: 'var(--ch-text)',
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      {myAssignment.buses.transport_drivers.phone}
                    </a>
                  </div>
                )}

                {pendingFee && (
                  <div
                    className="mt-4 rounded-xl border p-4 flex items-start gap-3"
                    style={{
                      backgroundColor: pendingFee.status === 'overdue'
                        ? 'rgba(220,38,38,0.06)'
                        : 'rgba(234,179,8,0.08)',
                      borderColor: pendingFee.status === 'overdue'
                        ? 'rgba(220,38,38,0.25)'
                        : 'rgba(234,179,8,0.25)',
                    }}
                  >
                    <IndianRupee
                      className="w-5 h-5 mt-0.5"
                      style={{ color: pendingFee.status === 'overdue' ? '#dc2626' : '#ca8a04' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                        {pendingFee.status === 'overdue' ? 'Transport fee overdue' : 'Transport fee pending'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                        ₹{Number(pendingFee.amount).toLocaleString('en-IN')} due by{' '}
                        {new Date(pendingFee.due_date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {myFees.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ch-muted)' }}>
                      Fee history
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ color: 'var(--ch-muted)' }}>
                            <th className="text-left font-medium py-2 pr-4">Amount</th>
                            <th className="text-left font-medium py-2 pr-4">Due</th>
                            <th className="text-left font-medium py-2 pr-4">Paid</th>
                            <th className="text-left font-medium py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myFees.map(f => (
                            <tr key={f.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                              <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--ch-text)' }}>
                                ₹{Number(f.amount).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 pr-4" style={{ color: 'var(--ch-muted)' }}>
                                {new Date(f.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="py-2 pr-4" style={{ color: 'var(--ch-muted)' }}>
                                {f.paid_date
                                  ? new Date(f.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                  : '—'}
                              </td>
                              <td className="py-2">
                                <StatusPill status={f.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-start gap-3 rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <Info className="w-5 h-5 text-[#e05252] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                    You're not assigned to a bus yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                    Browse the fleet and routes below. To get a seat, contact the transport office with
                    your preferred route and boarding stop.
                  </p>
                </div>
              </div>
            )}

            {/* Fleet stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Buses" value={fleet.length} />
              <StatCard
                label="Active"
                value={fleet.filter(b => b.status === 'active').length}
                tint="#16a34a"
              />
              <StatCard
                label="Routes"
                value={routes.length}
              />
              <StatCard
                label="Stops Served"
                value={routes.reduce((s, r) => s + (r.transport_route_stops?.length || 0), 0)}
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b" style={{ borderColor: 'var(--ch-border)' }}>
              <TabButton active={tab === 'fleet'} onClick={() => setTab('fleet')}>
                Fleet Directory
              </TabButton>
              <TabButton active={tab === 'routes'} onClick={() => setTab('routes')}>
                Routes & Timings
              </TabButton>
            </div>

            {tab === 'fleet' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--ch-muted)', opacity: 0.6 }}
                    />
                    <Input
                      placeholder="Search by bus number, route, or driver"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={routeFilter}
                    onChange={e => setRouteFilter(e.target.value)}
                    className="h-10 rounded-md border px-3 text-sm"
                    style={{
                      backgroundColor: 'var(--ch-card)',
                      borderColor: 'var(--ch-border)',
                      color: 'var(--ch-text)',
                    }}
                  >
                    <option value="all">All routes</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {filteredFleet.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'var(--ch-muted)' }}>
                    No buses match your search.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredFleet.map(b => (
                      <BusCard key={b.id} bus={b} isMine={myAssignment?.buses?.id === b.id} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'routes' && (
              <div className="space-y-4">
                {routes.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: 'var(--ch-muted)' }}>
                    No routes configured yet.
                  </p>
                ) : (
                  routes.map(r => (
                    <RouteCard
                      key={r.id}
                      route={r}
                      myStopId={myAssignment?.transport_route_stops?.id || null}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}

function InfoCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
          {label}
        </p>
      </div>
      <p className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold mt-1" style={{ color: tint || 'var(--ch-text)' }}>
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-semibold transition-colors relative"
      style={{
        color: active ? 'var(--ch-text)' : 'var(--ch-muted)',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute left-0 right-0 bottom-[-1px] h-[2px]"
          style={{ backgroundColor: 'var(--ch-accent)' }}
        />
      )}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    active: { bg: 'rgba(34,197,94,0.12)', fg: '#16a34a' },
    inactive: { bg: 'rgba(107,114,128,0.12)', fg: '#6b7280' },
    maintenance: { bg: 'rgba(234,179,8,0.15)', fg: '#ca8a04' },
    suspended: { bg: 'rgba(220,38,38,0.10)', fg: '#dc2626' },
    pending: { bg: 'rgba(234,179,8,0.15)', fg: '#ca8a04' },
    paid: { bg: 'rgba(34,197,94,0.12)', fg: '#16a34a' },
    partial: { bg: 'rgba(59,130,246,0.12)', fg: '#2563eb' },
    waived: { bg: 'rgba(107,114,128,0.12)', fg: '#6b7280' },
    overdue: { bg: 'rgba(220,38,38,0.10)', fg: '#dc2626' },
  };
  const c = colors[status] || colors.inactive;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}

function BusCard({ bus, isMine }: { bus: FleetBus; isMine: boolean }) {
  const c = STATUS_COLORS[bus.status] || STATUS_COLORS.inactive;
  const full = bus.seats_remaining === 0;
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{
        backgroundColor: isMine ? 'rgba(var(--ch-accent-rgb),0.05)' : 'var(--ch-card)',
        borderColor: isMine ? 'rgba(var(--ch-accent-rgb),0.35)' : 'var(--ch-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(var(--ch-accent-rgb),0.1)' }}
            >
              <Bus className="w-4 h-4 text-[#e05252]" />
            </div>
            <div>
              <p className="font-mono font-bold text-base" style={{ color: 'var(--ch-text)' }}>
                {bus.bus_number}
              </p>
              {isMine && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#e05252]">
                  Your Bus
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1"
          style={{ backgroundColor: c.bg, color: c.fg }}
        >
          {bus.status === 'maintenance' && <Wrench className="w-3 h-3" />}
          {bus.status}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
          <RouteIcon className="w-3.5 h-3.5" style={{ color: 'var(--ch-muted)' }} />
          <span className="truncate">{bus.transport_routes?.name || 'Not on a route'}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
          <User className="w-3.5 h-3.5" />
          <span className="truncate text-xs">{bus.transport_drivers?.full_name || 'No driver assigned'}</span>
        </div>
      </div>

      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--ch-border)' }}
      >
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ch-muted)' }}>
          <Users className="w-3.5 h-3.5" />
          <span>{bus.assigned_count}/{bus.capacity}</span>
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: full ? '#dc2626' : bus.seats_remaining <= 5 ? '#ca8a04' : '#16a34a' }}
        >
          {full ? 'Full' : `${bus.seats_remaining} seats free`}
        </span>
      </div>
    </div>
  );
}

function RouteCard({
  route, myStopId,
}: { route: RouteWithStops; myStopId: string | null }) {
  const stops = route.transport_route_stops || [];
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-[#e05252]" />
            <h3 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>
              {route.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
            {route.distance_km != null && <span>{route.distance_km} km</span>}
            <span>·</span>
            <span>₹{Number(route.fee_amount).toLocaleString('en-IN')} / term</span>
            <span>·</span>
            <span>{stops.length} {stops.length === 1 ? 'stop' : 'stops'}</span>
          </div>
        </div>
        <StatusPill status={route.status} />
      </div>

      {stops.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>No stops configured for this route yet.</p>
      ) : (
        <ol className="space-y-0">
          {stops.map((s, i) => {
            const isMine = s.id === myStopId;
            const isLast = i === stops.length - 1;
            return (
              <li key={s.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: isMine ? 'var(--ch-accent)' : 'var(--ch-card)',
                      borderColor: isMine ? 'var(--ch-accent)' : 'var(--ch-border)',
                    }}
                  />
                  {!isLast && (
                    <div
                      className="w-[2px] flex-1 my-1"
                      style={{ backgroundColor: 'var(--ch-border)' }}
                    />
                  )}
                </div>
                <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isMine ? 'var(--ch-accent)' : 'var(--ch-text)' }}
                    >
                      {s.stop_name}
                      {isMine && (
                        <span className="ml-2 text-[9px] font-bold uppercase">Your Stop</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
                      <Clock className="w-3 h-3" />
                      {formatTime(s.pickup_time)}
                    </div>
                  </div>
                  {s.landmark && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                      {s.landmark}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
