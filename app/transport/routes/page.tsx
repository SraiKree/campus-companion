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
import { Plus, Trash2, MapPin, Clock } from 'lucide-react';

interface Stop {
  id: string;
  stop_name: string;
  landmark: string | null;
  pickup_time: string;
  stop_order: number;
}
interface Route {
  id: string;
  name: string;
  distance_km: number | null;
  fee_amount: number;
  status: 'active' | 'suspended';
  transport_route_stops: Stop[];
}

const emptyStop = { stop_name: '', landmark: '', pickup_time: '' };

export default function RoutesPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', distance_km: '', fee_amount: '' });
  const [stops, setStops] = useState<Array<typeof emptyStop>>([{ ...emptyStop }]);
  const [submitting, setSubmitting] = useState(false);

  const [stopRouteId, setStopRouteId] = useState<string | null>(null);
  const [newStop, setNewStop] = useState({ ...emptyStop });

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await transportFetch('/api/transport/routes');
      setRoutes(data.routes);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  const handleCreateRoute = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const cleanStops = stops.filter(s => s.stop_name.trim() && s.pickup_time);
      await transportFetch('/api/transport/routes', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          distance_km: form.distance_km ? Number(form.distance_km) : null,
          fee_amount: Number(form.fee_amount || 0),
          stops: cleanStops,
        }),
      });
      setOpen(false);
      setForm({ name: '', distance_km: '', fee_amount: '' });
      setStops([{ ...emptyStop }]);
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = async (route: Route) => {
    if (!confirm(`Delete route "${route.name}"?`)) return;
    try {
      await transportFetch(`/api/transport/routes?id=${route.id}`, { method: 'DELETE' });
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleAddStop = async (routeId: string) => {
    if (!newStop.stop_name.trim() || !newStop.pickup_time) return;
    try {
      await transportFetch('/api/transport/routes/stops', {
        method: 'POST',
        body: JSON.stringify({ route_id: routeId, ...newStop }),
      });
      setNewStop({ ...emptyStop });
      setStopRouteId(null);
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Delete this stop?')) return;
    try {
      await transportFetch(`/api/transport/routes/stops?id=${stopId}`, { method: 'DELETE' });
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
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Routes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              {routes.length} route{routes.length === 1 ? '' : 's'} configured
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                <Plus className="w-4 h-4 mr-2" /> Create Route
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Route</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Route Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="KPHB — Campus" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Distance (km)</label>
                    <Input type="number" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} placeholder="18" />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Fee (₹/term)</label>
                    <Input type="number" value={form.fee_amount} onChange={e => setForm({ ...form, fee_amount: e.target.value })} placeholder="18000" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--ch-muted)' }}>Stops (in pickup order)</label>
                  <div className="space-y-2">
                    {stops.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={s.stop_name}
                          onChange={e => {
                            const next = [...stops]; next[idx] = { ...next[idx], stop_name: e.target.value }; setStops(next);
                          }}
                          placeholder="Stop name"
                        />
                        <Input
                          type="time"
                          value={s.pickup_time}
                          onChange={e => {
                            const next = [...stops]; next[idx] = { ...next[idx], pickup_time: e.target.value }; setStops(next);
                          }}
                          className="w-32"
                        />
                        <Button variant="ghost" size="sm" onClick={() => setStops(stops.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStops([...stops, { ...emptyStop }])} className="mt-2">
                    <Plus className="w-3 h-3 mr-1" /> Add stop
                  </Button>
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={submitting || !form.name} onClick={handleCreateRoute} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                  {submitting ? 'Saving…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && !open && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : routes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No routes yet.</p>
        ) : (
          <div className="grid gap-4">
            {routes.map(r => (
              <div key={r.id} className="rounded-xl border p-5" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>{r.name}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                      {r.distance_km ? `${r.distance_km} km · ` : ''}₹{Number(r.fee_amount).toLocaleString('en-IN')} / term · {r.status}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRoute(r)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {r.transport_route_stops.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm py-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" style={{ color: 'var(--ch-muted)' }} />
                        <span style={{ color: 'var(--ch-text)' }}>{s.stop_order}. {s.stop_name}</span>
                        {s.landmark && <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>({s.landmark})</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
                          <Clock className="w-3 h-3" /> {s.pickup_time.slice(0, 5)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteStop(s.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {stopRouteId === r.id ? (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newStop.stop_name}
                      onChange={e => setNewStop({ ...newStop, stop_name: e.target.value })}
                      placeholder="Stop name"
                    />
                    <Input
                      type="time"
                      value={newStop.pickup_time}
                      onChange={e => setNewStop({ ...newStop, pickup_time: e.target.value })}
                      className="w-32"
                    />
                    <Button size="sm" onClick={() => handleAddStop(r.id)}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setStopRouteId(null); setNewStop({ ...emptyStop }); }}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setStopRouteId(r.id)} className="mt-3">
                    <Plus className="w-3 h-3 mr-1" /> Add stop
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TransportLayout>
  );
}
