'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Eye, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { allApprovals, DEPARTMENTS } from './data';
import type { ApprovalItem } from './data';
import { statusBadge, priorityBadge, DetailField } from './ui-helpers';

interface TypeFilteredTabProps {
  type: 'academic' | 'student' | 'financial' | 'event';
}

export default function TypeFilteredTab({ type }: TypeFilteredTabProps) {
  const items = allApprovals.filter((a) => a.type === type);
  const [deptFilt, setDeptFilt] = useState('All');
  const [view, setView] = useState<ApprovalItem | null>(null);

  const filtered = useMemo(() => {
    if (deptFilt === 'All') return items;
    return items.filter((a) => a.dept === deptFilt);
  }, [items, deptFilt]);

  const pending = filtered.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>
          {pending.length} pending of {filtered.length} total
        </p>
        <Select value={deptFilt} onValueChange={setDeptFilt}>
          <SelectTrigger className="w-[150px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Title</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Sub-Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>From</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Priority</TableHead>
                {type === 'financial' || type === 'event' ? <TableHead style={{ color: 'var(--ch-muted)' }}>Amount</TableHead> : null}
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12">
                  <Inbox className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--ch-muted)' }} />
                  <p style={{ color: 'var(--ch-muted)' }}>No requests.</p>
                </TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.subType}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.from}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.dept}</Badge></TableCell>
                  <TableCell>{priorityBadge(a.priority)}</TableCell>
                  {(type === 'financial' || type === 'event') && <TableCell className="font-semibold" style={{ color: 'var(--ch-text)' }}>{a.amount || '—'}</TableCell>}
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(a)}>
                      <Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
