'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Search } from 'lucide-react';

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
import type { HostelComplaint } from '@/lib/hostel-mock';

type StatusFilter = 'All' | 'Submitted' | 'In Review' | 'Resolved';

interface ComplaintsTabProps {
  complaints: HostelComplaint[];
  onResolve: (id: string) => void;
}

export default function ComplaintsTab({ complaints, onResolve }: ComplaintsTabProps) {
  const [status, setStatus] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HostelComplaint | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints
      .filter(c => status === 'All' || c.status === status)
      .filter(c => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.student_name.toLowerCase().includes(q) ||
          c.student_roll.toLowerCase().includes(q) ||
          c.room_no.toLowerCase().includes(q)
        );
      });
  }, [complaints, status, query]);

  const selectedLive = selected
    ? complaints.find(c => c.id === selected.id) ?? null
    : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-lg border p-1"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {(['All', 'Submitted', 'In Review', 'Resolved'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                backgroundColor: status === f ? 'var(--ch-accent)' : 'transparent',
                color: status === f ? 'white' : 'var(--ch-muted)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--ch-muted)' }}
          />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search complaints…"
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
            No hostel complaints match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--ch-muted)' }}>
                  <th className="text-left font-medium p-4">Title</th>
                  <th className="text-left font-medium p-4">Submitted By</th>
                  <th className="text-left font-medium p-4">Room</th>
                  <th className="text-left font-medium p-4">Date</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-right font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                    <td className="p-4 font-medium max-w-xs truncate" style={{ color: 'var(--ch-text)' }}>
                      {c.title}
                    </td>
                    <td className="p-4" style={{ color: 'var(--ch-text)' }}>
                      <p className="font-heading font-semibold text-base">{c.student_name}</p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{c.student_roll}</p>
                    </td>
                    <td className="p-4" style={{ color: 'var(--ch-text)' }}>
                      {c.room_no} / {c.block}
                    </td>
                    <td className="p-4" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <ComplaintStatusBadge status={c.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(c)}
                          className="h-8 gap-1.5 text-xs"
                          style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        {c.status !== 'Resolved' && (
                          <Button
                            size="sm"
                            onClick={() => onResolve(c.id)}
                            className="h-8 gap-1.5 text-xs bg-[#059669] hover:bg-[#047857] text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
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

      {/* Complaint details modal */}
      <Dialog open={!!selectedLive} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {selectedLive && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--ch-text)' }}>{selectedLive.title}</DialogTitle>
                <DialogDescription style={{ color: 'var(--ch-muted)' }}>
                  Submitted {new Date(selectedLive.created_at).toLocaleDateString()} • Room{' '}
                  {selectedLive.room_no} / Block {selectedLive.block}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--ch-muted)' }}
                  >
                    Description
                  </p>
                  <p className="text-sm" style={{ color: 'var(--ch-text)' }}>
                    {selectedLive.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: 'var(--ch-muted)' }}
                    >
                      Submitted by
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                      {selectedLive.student_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      {selectedLive.student_roll}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: 'var(--ch-muted)' }}
                    >
                      Status
                    </p>
                    <ComplaintStatusBadge status={selectedLive.status} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  Close
                </Button>
                {selectedLive.status !== 'Resolved' && (
                  <Button
                    onClick={() => {
                      onResolve(selectedLive.id);
                    }}
                    className="bg-[#059669] hover:bg-[#047857] text-white gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as resolved
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComplaintStatusBadge({ status }: { status: HostelComplaint['status'] }) {
  const map: Record<HostelComplaint['status'], { bg: string; fg: string }> = {
    Submitted:   { bg: 'rgba(224,82,82,0.1)',  fg: '#e05252' },
    'In Review': { bg: 'rgba(234,179,8,0.12)', fg: '#b45309' },
    Resolved:    { bg: 'rgba(16,185,129,0.1)', fg: '#059669' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}
