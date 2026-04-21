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
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  notes: string | null;
  route_id: string | null;
  driver_id: string | null;
  transport_routes: { id: string; name: string } | null;
  transport_drivers: { id: string; full_name: string; phone: string } | null;
  assigned_count: number;
  seats_remaining: number;
}

interface Option { id: string; name: string }

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Under Maintenance' },
];

const emptyForm = {
  bus_number: '',
  capacity: '',
  route_id: '',
  driver_id: '',
  status: 'active',
  notes: '',
};

export default function BusesPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Option[]>([]);
  const [drivers, setDrivers] = useState<Option[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const [b, r, d] = await Promise.all([
        transportFetch('/api/transport/buses'),
        transportFetch('/api/transport/routes'),
        transportFetch('/api/transport/drivers'),
      ]);
      setBuses(b.buses);
      setRoutes((r.routes || []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      setDrivers((d.drivers || []).map((x: { id: string; full_name: string }) => ({ id: x.id, name: x.full_name })));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (bus: Bus) => {
    setEditing(bus);
    setForm({
      bus_number: bus.bus_number,
      capacity: bus.capacity.toString(),
      route_id: bus.route_id || '',
      driver_id: bus.driver_id || '',
      status: bus.status,
      notes: bus.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        bus_number: form.bus_number.trim(),
        capacity: Number(form.capacity),
        route_id: form.route_id || null,
        driver_id: form.driver_id || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await transportFetch(`/api/transport/buses?id=${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await transportFetch('/api/transport/buses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bus: Bus) => {
    if (!confirm(`Delete bus ${bus.bus_number}?`)) return;
    try {
      await transportFetch(`/api/transport/buses?id=${bus.id}`, { method: 'DELETE' });
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
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Buses</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              {buses.length} bus{buses.length === 1 ? '' : 'es'} in fleet
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Bus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Bus' : 'Add Bus'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Bus Number</label>
                  <Input value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} placeholder="MLR-07" />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Capacity</label>
                  <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="55" />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Route</label>
                  <Select value={form.route_id || 'none'} onValueChange={v => setForm({ ...form, route_id: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— none —</SelectItem>
                      {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Driver</label>
                  <Select value={form.driver_id || 'none'} onValueChange={v => setForm({ ...form, driver_id: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— none —</SelectItem>
                      {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Status</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Notes</label>
                  <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="AC, new tyres..." />
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={submitting || !form.bus_number || !form.capacity}
                  onClick={handleSubmit}
                  style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
                >
                  {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && !open && (
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : buses.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No buses yet. Click “Add Bus” to start.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Bus #</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Capacity</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Route</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Driver</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {buses.map(b => (
                  <tr key={b.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--ch-text)' }}>{b.bus_number}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>
                      {b.assigned_count}/{b.capacity}
                      <span className="text-xs ml-2" style={{ color: 'var(--ch-muted)' }}>
                        ({b.seats_remaining} free)
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{b.transport_routes?.name || '—'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>{b.transport_drivers?.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                        backgroundColor: b.status === 'active' ? 'rgba(34,197,94,0.1)' : b.status === 'maintenance' ? 'rgba(234,179,8,0.1)' : 'rgba(107,114,128,0.1)',
                        color: b.status === 'active' ? '#16a34a' : b.status === 'maintenance' ? '#ca8a04' : '#6b7280',
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(b)}>
                        <Trash2 className="w-4 h-4" />
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
