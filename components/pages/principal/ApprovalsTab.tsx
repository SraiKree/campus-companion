'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Search, Eye, CheckCircle, XCircle, ArrowUpRight, Inbox } from 'lucide-react';
import { allApprovals, DEPARTMENTS, PRIORITIES, TYPE_LABELS } from './data';
import type { ApprovalItem, Status } from './data';
import { statusBadge, priorityBadge, DetailField } from './ui-helpers';

export default function ApprovalsTab() {
  const [search, setSearch] = useState('');
  const [typeFilt, setTypeFilt] = useState('all');
  const [deptFilt, setDeptFilt] = useState('All');
  const [prioFilt, setPrioFilt] = useState('all');
  const [statusFilt, setStatusFilt] = useState<string>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ApprovalItem | null>(null);

  const filtered = useMemo(() => {
    return allApprovals.filter((a) => {
      const ms = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.from.toLowerCase().includes(search.toLowerCase());
      const mt = typeFilt === 'all' || a.type === typeFilt;
      const md = deptFilt === 'All' || a.dept === deptFilt;
      const mp = prioFilt === 'all' || a.priority === prioFilt;
      const mst = statusFilt === 'all' || a.status === statusFilt;
      return ms && mt && md && mp && mst;
    });
  }, [search, typeFilt, deptFilt, prioFilt, statusFilt]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const pendingSelected = [...selected].filter((id) => {
    const item = allApprovals.find((a) => a.id === id);
    return item?.status === 'pending';
  });

  const statusCounts = {
    pending: allApprovals.filter((a) => a.status === 'pending').length,
    approved: allApprovals.filter((a) => a.status === 'approved').length,
    rejected: allApprovals.filter((a) => a.status === 'rejected').length,
    delegated: allApprovals.filter((a) => a.status === 'delegated').length,
  };

  return (
    <div className="space-y-6">
      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'delegated', 'all'] as const).map((s) => {
          const active = statusFilt === s;
          const count = s === 'all' ? allApprovals.length : statusCounts[s as keyof typeof statusCounts];
          return (
            <Button
              key={s}
              variant={active ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg gap-1.5"
              style={active ? { backgroundColor: 'var(--ch-accent)', color: 'white' } : {}}
              onClick={() => { setStatusFilt(s); setSelected(new Set()); }}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="text-xs opacity-70">({count})</span>
            </Button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
          <Input
            placeholder="Search by ID, title, or requester..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
          />
        </div>
        <Select value={typeFilt} onValueChange={setTypeFilt}>
          <SelectTrigger className="w-[150px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilt} onValueChange={setDeptFilt}>
          <SelectTrigger className="w-[150px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={prioFilt} onValueChange={setPrioFilt}>
          <SelectTrigger className="w-[150px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {pendingSelected.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--ch-muted-bg)', borderColor: 'var(--ch-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{pendingSelected.length} selected</span>
          <Button size="sm" className="gap-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-md border-red-500/30 text-red-600 hover:bg-red-500/5"><XCircle className="h-3.5 w-3.5" /> Reject</Button>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-md"><ArrowUpRight className="h-3.5 w-3.5" /> Delegate</Button>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead className="w-10">
                  <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Title</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>From</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Priority</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Waiting</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12">
                  <Inbox className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--ch-muted)' }} />
                  <p style={{ color: 'var(--ch-muted)' }}>No requests match your filters.</p>
                </TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)', backgroundColor: a.priority === 'critical' && a.status === 'pending' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" style={{ color: 'var(--ch-text)' }}>{a.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[a.type]}</Badge></TableCell>
                  <TableCell className="text-sm" style={{ color: 'var(--ch-text)' }}>{a.from}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.dept}</Badge></TableCell>
                  <TableCell>{priorityBadge(a.priority)}</TableCell>
                  <TableCell style={{ color: a.hoursAgo > 48 ? '#ef4444' : 'var(--ch-text)' }} className="text-sm font-medium">{a.hoursAgo}h</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(a)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.title}</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.id} &mdash; {view?.subType}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="From" value={view.from} />
                <DetailField label="Department" value={view.dept} />
                <DetailField label="Date" value={view.date} />
                <div><p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Priority</p>{priorityBadge(view.priority)}</div>
                {view.amount && <DetailField label="Amount" value={view.amount} />}
                <div><p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Status</p>{statusBadge(view.status)}</div>
              </div>
              <DetailField label="Description" value={view.description} />
              {view.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="gap-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-md border-red-500/30 text-red-600 hover:bg-red-500/5"><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-md"><ArrowUpRight className="h-3.5 w-3.5" /> Delegate</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
