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
import { Plus, Pencil, Trash2, AlertTriangle, Phone } from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  license_number: string;
  license_expiry: string;
  address: string | null;
  joining_date: string | null;
  status: 'available' | 'assigned' | 'on_leave' | 'inactive';
  buses: Array<{ id: string; bus_number: string }>;
}

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm = {
  full_name: '',
  phone: '',
  alternate_phone: '',
  license_number: '',
  license_expiry: '',
  address: '',
  joining_date: '',
  status: 'available',
};

const daysUntil = (dateStr: string) => {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  return Math.floor(diff);
};

export default function DriversPage() {
  const { loading, authorized } = useRoleProtection('transport');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await transportFetch('/api/transport/drivers');
      setDrivers(data.drivers);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { if (authorized) load(); }, [authorized, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({
      full_name: d.full_name,
      phone: d.phone,
      alternate_phone: d.alternate_phone || '',
      license_number: d.license_number,
      license_expiry: d.license_expiry,
      address: d.address || '',
      joining_date: d.joining_date || '',
      status: d.status,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        alternate_phone: form.alternate_phone.trim() || null,
        license_number: form.license_number.trim(),
        license_expiry: form.license_expiry,
        address: form.address.trim() || null,
        joining_date: form.joining_date || null,
        status: form.status,
      };
      if (editing) {
        await transportFetch(`/api/transport/drivers?id=${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await transportFetch('/api/transport/drivers', {
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

  const handleDelete = async (d: Driver) => {
    if (!confirm(`Delete driver ${d.full_name}?`)) return;
    try {
      await transportFetch(`/api/transport/drivers?id=${d.id}`, { method: 'DELETE' });
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
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Drivers</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              {drivers.length} driver{drivers.length === 1 ? '' : 's'} on record
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                <Plus className="w-4 h-4 mr-2" /> Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit Driver' : 'Add Driver'}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Full Name</label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Phone</label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Alternate Phone</label>
                    <Input value={form.alternate_phone} onChange={e => setForm({ ...form, alternate_phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>License Number</label>
                    <Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>License Expiry</label>
                    <Input type="date" value={form.license_expiry} onChange={e => setForm({ ...form, license_expiry: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Address</label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Joining Date</label>
                    <Input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} />
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
                </div>
                {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={submitting || !form.full_name || !form.phone || !form.license_number || !form.license_expiry}
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
          <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>{error}</div>
        )}

        {fetching ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
        ) : drivers.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No drivers yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Phone</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>License</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Bus</th>
                  <th className="text-left px-4 py-2 text-xs font-bold uppercase" style={{ color: 'var(--ch-muted)' }}>Status</th>
                  <th className="text-right px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const days = daysUntil(d.license_expiry);
                  const expiringSoon = days <= 30 && days >= 0;
                  const expired = days < 0;
                  return (
                    <tr key={d.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--ch-text)' }}>{d.full_name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" style={{ color: 'var(--ch-muted)' }} />
                          {d.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ch-text)' }}>
                        <div className="font-mono text-xs">{d.license_number}</div>
                        <div className="text-xs flex items-center gap-1" style={{
                          color: expired ? '#dc2626' : expiringSoon ? '#ca8a04' : 'var(--ch-muted)',
                        }}>
                          {(expired || expiringSoon) && <AlertTriangle className="w-3 h-3" />}
                          expires {new Date(d.license_expiry).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--ch-text)' }}>
                        {d.buses?.map(b => b.bus_number).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                          backgroundColor: d.status === 'assigned' ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                          color: d.status === 'assigned' ? '#16a34a' : '#6b7280',
                        }}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(d)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TransportLayout>
  );
}
