'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import TransportLayout from '@/components/layout/TransportLayout';
import { transportFetch } from '@/lib/transport-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, ArrowRightLeft, XCircle, Search } from 'lucide-react';

interface Assignment {
  id: string;
  student_roll: string;
  student_name: string;
  status: 'active' | 'suspended' | 'ended';
  start_date: string;
  end_date: string | null;
  buses: { id: string; bus_number: string } | null;
  transport_routes: { id: string; name: string; fee_amount: number } | null;
  transport_route_stops: { id: string; stop_name: string; pickup_time: string } | null;
}
interface Route {
  id: string;
  name: string;
  fee_amount: number;
  transport_route_stops: Array<{ id: string; stop_name: string; pickup_time: string; stop_order: number }>;
}
interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  seats_remaining: number;
  route_id: string | null;
}
interface Student {
  roll_number: string;
  name: string;
  class_name: string | null;
  department: string | null;
}

export default function AssignmentsPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBus, setFilterBus] = useState<string>('all');

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [picked, setPicked] = useState<Student | null>(null);
  const [pickedRoute, setPickedRoute] = useState<string>('');
  const [pickedStop, setPickedStop] = useState<string>('');
  const [pickedBus, setPickedBus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Transfer dialog
  const [transferring, setTransferring] = useState<Assignment | null>(null);
  const [transferRoute, setTransferRoute] = useState<string>('');
  const [transferStop, setTransferStop] = useState<string>('');
  const [transferBus, setTransferBus] = useState<string>('');

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const busFilter = filterBus !== 'all' ? `?bus_id=${filterBus}` : '';
      const [a, r, b] = await Promise.all([
        transportFetch(`/api/transport/assignments${busFilter}`),
        transportFetch('/api/transport/routes'),
        transportFetch('/api/transport/buses'),
      ]);
      setAssignments(a.assignments);
      setRoutes(r.routes);
      setBuses(b.buses);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, [filterBus]);

  useEffect(() => { if (authorized) load(); }, [authorized, load]);

  useEffect(() => {
    if (studentQuery.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await transportFetch(`/api/transport/students/search?q=${encodeURIComponent(studentQuery.trim())}`);
        setResults(data.students);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [studentQuery]);

  const selectedRoute = routes.find(r => r.id === pickedRoute);
  const routeBuses = buses.filter(b => b.route_id === pickedRoute && b.seats_remaining > 0);

  const transferSelectedRoute = routes.find(r => r.id === transferRoute);
  const transferRouteBuses = buses.filter(b => b.route_id === transferRoute && b.seats_remaining > 0);

  const resetAssign = () => {
    setPicked(null); setStudentQuery(''); setResults([]);
    setPickedRoute(''); setPickedStop(''); setPickedBus('');
  };

  const handleAssign = async () => {
    if (!picked || !pickedRoute || !pickedStop || !pickedBus) return;
    setSubmitting(true);
    setError(null);
    try {
      await transportFetch('/api/transport/assignments', {
        method: 'POST',
        body: JSON.stringify({
          student_roll: picked.roll_number,
          route_id: pickedRoute,
          stop_id: pickedStop,
          bus_id: pickedBus,
        }),
      });
      setAssignOpen(false);
      resetAssign();
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openTransfer = (a: Assignment) => {
    setTransferring(a);
    setTransferRoute(a.transport_routes?.id || '');
    setTransferStop(a.transport_route_stops?.id || '');
    setTransferBus(a.buses?.id || '');
  };

  const handleTransfer = async () => {
    if (!transferring) return;
    setSubmitting(true);
    setError(null);
    try {
      await transportFetch(`/api/transport/assignments?id=${transferring.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          route_id: transferRoute,
          stop_id: transferStop,
          bus_id: transferBus,
        }),
      });
      setTransferring(null);
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async (a: Assignment) => {
    if (!confirm(`End assignment for ${a.student_roll}?`)) return;
    try {
      await transportFetch(`/api/transport/assignments?id=${a.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ended', end_date: new Date().toISOString().slice(0, 10) }),
      });
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <TransportLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Assignments</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              {assignments.length} active assignment{assignments.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filterBus} onValueChange={setFilterBus}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by bus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All buses</SelectItem>
                {buses.map(b => <SelectItem key={b.id} value={b.id}>{b.bus_number}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={assignOpen} onOpenChange={(v) => { setAssignOpen(v); if (!v) resetAssign(); }}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                  <Plus className="w-4 h-4 mr-2" /> Assign Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Assign Student to Transport</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  {!picked ? (
                    <>
                      <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Search student (roll or name)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
                        <Input value={studentQuery} onChange={e => setStudentQuery(e.target.value)} placeholder="23R21A1285 or name" className="pl-10" />
                      </div>
                      {results.length > 0 && (
                        <div className="rounded-md border max-h-48 overflow-y-auto" style={{ borderColor: 'var(--ch-border)' }}>
                          {results.map(s => (
                            <button
                              key={s.roll_number}
                              onClick={() => setPicked(s)}
                              className="w-full text-left px-3 py-2 hover:bg-black/5 border-b last:border-b-0"
                              style={{ borderColor: 'var(--ch-border)' }}
                            >
                              <div className="font-mono text-sm" style={{ color: 'var(--ch-text)' }}>{s.roll_number}</div>
                              <div className="text-xs" style={{ color: 'var(--ch-muted)' }}>{s.name} · {s.class_name || s.department}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-md border p-3 flex items-center justify-between" style={{ borderColor: 'var(--ch-border)' }}>
                        <div>
                          <div className="font-mono text-sm" style={{ color: 'var(--ch-text)' }}>{picked.roll_number}</div>
                          <div className="text-xs" style={{ color: 'var(--ch-muted)' }}>{picked.name}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>Change</Button>
                      </div>

                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Route</label>
                        <Select value={pickedRoute} onValueChange={v => { setPickedRoute(v); setPickedStop(''); setPickedBus(''); }}>
                          <SelectTrigger><SelectValue placeholder="Pick route" /></SelectTrigger>
                          <SelectContent>
                            {routes.filter(r => r.transport_route_stops.length > 0).map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name} — ₹{Number(r.fee_amount).toLocaleString('en-IN')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedRoute && (
                        <div>
                          <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Stop</label>
                          <Select value={pickedStop} onValueChange={setPickedStop}>
                            <SelectTrigger><SelectValue placeholder="Pick stop" /></SelectTrigger>
                            <SelectContent>
                              {selectedRoute.transport_route_stops.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.stop_name} — {s.pickup_time.slice(0, 5)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedRoute && (
                        <div>
                          <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Bus</label>
                          <Select value={pickedBus} onValueChange={setPickedBus}>
                            <SelectTrigger><SelectValue placeholder={routeBuses.length === 0 ? 'No bus with free seats' : 'Pick bus'} /></SelectTrigger>
                            <SelectContent>
                              {routeBuses.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.bus_number} — {b.seats_remaining}/{b.capacity} free</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                  {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setAssignOpen(false); resetAssign(); }}>Cancel</Button>
                  <Button
                    disabled={submitting || !picked || !pickedRoute || !pickedStop || !pickedBus}
                    onClick={handleAssign}
                    style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
                  >
                    {submitting ? 'Assigning…' : 'Confirm'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transfer dialog */}
        <Dialog open={!!transferring} onOpenChange={v => !v && setTransferring(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Transfer {transferring?.student_roll}</DialogTitle></DialogHeader>
            {transferring && (
              <div className="space-y-3 py-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Route</label>
                  <Select value={transferRoute} onValueChange={v => { setTransferRoute(v); setTransferStop(''); setTransferBus(''); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {transferSelectedRoute && (
                  <>
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Stop</label>
                      <Select value={transferStop} onValueChange={setTransferStop}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {transferSelectedRoute.transport_route_stops.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.stop_name} — {s.pickup_time.slice(0, 5)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Bus</label>
                      <Select value={transferBus} onValueChange={setTransferBus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {transferRouteBuses.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.bus_number} — {b.seats_remaining}/{b.capacity} free</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTransferring(null)}>Cancel</Button>
              <Button
                disabled={submitting || !transferRoute || !transferStop || !transferBus}
                onClick={handleTransfer}
                style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
              >
                {submitting ? 'Transferring…' : 'Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No assignments found.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Roll</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Route</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Bus</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Stop</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--ch-text)' }}>{a.student_roll}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{a.student_name || '—'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{a.transport_routes?.name}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--ch-text)' }}>{a.buses?.bus_number}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>
                      {a.transport_route_stops?.stop_name}
                      <div className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        {a.transport_route_stops?.pickup_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openTransfer(a)} title="Transfer">
                        <ArrowRightLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEnd(a)} title="End">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TransportLayout>
  );
}
