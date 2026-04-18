'use client';

import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HostelRoom, HostelStudent } from '@/lib/hostel-mock';

interface RoomsTabProps {
  rooms: HostelRoom[];
  students: HostelStudent[];        // use active students to compute occupancy
  blocks: string[];
}

type OccupancyFilter = 'All' | 'Available' | 'Full';

export default function RoomsTab({ rooms, students, blocks }: RoomsTabProps) {
  const [block, setBlock] = useState<string>('All');
  const [occupancy, setOccupancy] = useState<OccupancyFilter>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HostelRoom | null>(null);

  // Occupants for each room
  const occupantsByRoom = useMemo(() => {
    const map = new Map<string, HostelStudent[]>();
    for (const s of students) {
      if (s.status !== 'Active') continue;
      const key = `${s.block}-${s.room_no}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [students]);

  const enriched = useMemo(
    () =>
      rooms.map(r => {
        const occupants = occupantsByRoom.get(`${r.block}-${r.room_no}`) ?? [];
        return {
          ...r,
          occupied: occupants.length,
          occupants,
          isFull: occupants.length >= r.capacity,
        };
      }),
    [rooms, occupantsByRoom]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter(r => block === 'All' || r.block === block)
      .filter(r => {
        if (occupancy === 'Available') return !r.isFull;
        if (occupancy === 'Full') return r.isFull;
        return true;
      })
      .filter(r => {
        if (!q) return true;
        return r.room_no.toLowerCase().includes(q) || r.block.toLowerCase().includes(q);
      });
  }, [enriched, block, occupancy, query]);

  const selectedWithOccupants = selected
    ? enriched.find(r => r.id === selected.id) ?? null
    : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-lg border p-1"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {(['All', 'Available', 'Full'] as OccupancyFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setOccupancy(f)}
              className="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors"
              style={{
                backgroundColor: occupancy === f ? 'var(--ch-accent)' : 'transparent',
                color: occupancy === f ? 'white' : 'var(--ch-muted)',
              }}
            >
              {f}
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
            placeholder="Search by room or block…"
            className="pl-10 border"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              color: 'var(--ch-text)',
            }}
          />
        </div>
      </div>

      {/* Rooms grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center text-sm"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
            color: 'var(--ch-muted)',
          }}
        >
          No matching rooms.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="rounded-2xl border p-5 text-left transition-all hover:border-[#e05252] hover:shadow-sm"
              style={{
                backgroundColor: 'var(--ch-card)',
                borderColor: 'var(--ch-border)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--ch-muted)' }}
                  >
                    Block {r.block}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
                    Room {r.room_no}
                  </p>
                </div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: r.isFull ? 'rgba(224,82,82,0.1)' : 'rgba(16,185,129,0.1)',
                    color: r.isFull ? '#e05252' : '#059669',
                  }}
                >
                  {r.isFull ? 'FULL' : 'AVAILABLE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: 'var(--ch-muted)' }}>
                  <Users className="w-4 h-4" />
                  <span className="text-xs">
                    <strong style={{ color: 'var(--ch-text)' }}>{r.occupied}</strong> / {r.capacity}
                  </span>
                </div>
                {/* Simple progress bar */}
                <div
                  className="w-24 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--ch-muted-bg)' }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, (r.occupied / r.capacity) * 100)}%`,
                      backgroundColor: r.isFull ? '#e05252' : '#059669',
                    }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Room detail modal */}
      <Dialog open={!!selectedWithOccupants} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {selectedWithOccupants && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--ch-text)' }}>
                  Room {selectedWithOccupants.room_no} — Block {selectedWithOccupants.block}
                </DialogTitle>
                <DialogDescription style={{ color: 'var(--ch-muted)' }}>
                  {selectedWithOccupants.occupied} of {selectedWithOccupants.capacity} beds occupied
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2">
                {selectedWithOccupants.occupants.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                    No students allocated to this room yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedWithOccupants.occupants.map(o => (
                      <li
                        key={o.id}
                        className="flex items-center gap-3 rounded-xl border p-3"
                        style={{
                          backgroundColor: 'var(--ch-bg)',
                          borderColor: 'var(--ch-border)',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: 'var(--ch-accent)' }}
                        >
                          {o.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                            {o.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                            {o.roll_number} • {o.department} • Year {o.year}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
