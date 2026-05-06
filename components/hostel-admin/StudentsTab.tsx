'use client';

import { useMemo, useState } from 'react';
import { Eye, LogOut, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HostelStudent, StudentStatus } from '@/lib/hostel-mock';

interface StudentsTabProps {
  students: HostelStudent[];
  blocks: string[];
  onMarkAsLeft: (id: string) => void;
}

export default function StudentsTab({
  students,
  blocks,
  onMarkAsLeft,
}: StudentsTabProps) {
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [block, setBlock] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HostelStudent | null>(null);
  const [confirmLeft, setConfirmLeft] = useState<HostelStudent | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter(s => s.status === status)
      .filter(s => block === 'All' || s.block === block)
      .filter(s => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.roll_number.toLowerCase().includes(q) ||
          s.room_no.toLowerCase().includes(q)
        );
      });
  }, [students, status, block, query]);

  const handleConfirmMarkLeft = () => {
    if (confirmLeft) {
      onMarkAsLeft(confirmLeft.id);
      setConfirmLeft(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status toggle + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-lg border p-1"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {(['Active', 'Left'] as StudentStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors"
              style={{
                backgroundColor: status === s ? 'var(--ch-accent)' : 'transparent',
                color: status === s ? 'white' : 'var(--ch-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={block}
          onChange={e => setBlock(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
            color: 'var(--ch-text)',
          }}
        >
          <option value="All">All blocks</option>
          {blocks.map(b => (
            <option key={b} value={b}>Block {b}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--ch-muted)' }}
          />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, roll, room…"
            className="pl-10 border"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              color: 'var(--ch-text)',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
            No matching students.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--ch-muted)' }}>
                  <th className="text-left font-medium p-4">Name</th>
                  <th className="text-left font-medium p-4">Roll Number</th>
                  {status === 'Active' ? (
                    <>
                      <th className="text-left font-medium p-4">Room</th>
                      <th className="text-left font-medium p-4">Block</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left font-medium p-4">Previous Room</th>
                      <th className="text-left font-medium p-4">Date Left</th>
                    </>
                  )}
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-right font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td
                      className="p-4 font-heading font-semibold text-base"
                      style={{ color: 'var(--ch-text)' }}
                    >
                      {s.name}
                    </td>
                    <td className="p-4" style={{ color: 'var(--ch-muted)' }}>{s.roll_number}</td>
                    {status === 'Active' ? (
                      <>
                        <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{s.room_no}</td>
                        <td className="p-4 font-semibold" style={{ color: 'var(--ch-text)' }}>{s.block}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4" style={{ color: 'var(--ch-text)' }}>{s.room_no} / {s.block}</td>
                        <td className="p-4" style={{ color: 'var(--ch-muted)' }}>
                          {s.left_at ? new Date(s.left_at).toLocaleDateString() : '—'}
                        </td>
                      </>
                    )}
                    <td className="p-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(s)}
                          className="h-8 gap-1.5 text-xs"
                          style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        {s.status === 'Active' && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmLeft(s)}
                            className="h-8 gap-1.5 text-xs bg-[#e05252] hover:bg-[#c94545] text-white"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Mark Left
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details modal */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle
                  className="font-heading font-bold text-xl"
                  style={{ color: 'var(--ch-text)' }}
                >
                  {selected.name}
                </DialogTitle>
                <DialogDescription style={{ color: 'var(--ch-muted)' }}>
                  {selected.roll_number} • {selected.department} • Year {selected.year}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <DetailRow label="Room"          value={`${selected.room_no} / Block ${selected.block}`} />
                <DetailRow label="Status"        value={selected.status} />
                <DetailRow label="Phone"         value={selected.phone} />
                <DetailRow label="Email"         value={selected.email} breakAll />
                <DetailRow label="Guardian"      value={selected.guardian_name} />
                <DetailRow label="Guardian phone" value={selected.guardian_phone} />
                <DetailRow label="Allocated on"  value={new Date(selected.allocated_at).toLocaleDateString()} />
                {selected.left_at && (
                  <DetailRow label="Left on" value={new Date(selected.left_at).toLocaleDateString()} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm mark-as-left modal */}
      <Dialog open={!!confirmLeft} onOpenChange={o => !o && setConfirmLeft(null)}>
        <DialogContent
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {confirmLeft && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--ch-text)' }}>Mark student as left?</DialogTitle>
                <DialogDescription style={{ color: 'var(--ch-muted)' }}>
                  {confirmLeft.name} ({confirmLeft.roll_number}) will be moved to the Left students
                  list and the room <strong>{confirmLeft.room_no} / {confirmLeft.block}</strong> will
                  have one fewer occupant.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmLeft(null)}
                  style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmMarkLeft}
                  className="bg-[#e05252] hover:bg-[#c94545] text-white"
                >
                  Yes, mark as left
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
  breakAll,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ color: 'var(--ch-muted)' }}
      >
        {label}
      </p>
      <p
        className={`text-sm font-medium ${breakAll ? 'break-all' : ''}`}
        style={{ color: 'var(--ch-text)' }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const isActive = status === 'Active';
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(224,82,82,0.1)',
        color: isActive ? '#059669' : '#e05252',
      }}
    >
      {status}
    </span>
  );
}
