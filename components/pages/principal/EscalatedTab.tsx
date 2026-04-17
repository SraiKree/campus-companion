'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Eye, AlertTriangle, Clock, Timer, CheckCircle, XCircle } from 'lucide-react';
import { allApprovals } from './data';
import type { ApprovalItem } from './data';
import { StatCard, statusBadge, priorityBadge, DetailField } from './ui-helpers';

export default function EscalatedTab() {
  const [view, setView] = useState<ApprovalItem | null>(null);

  // Aggregate: escalated type + any pending > 48 hours + any critical
  const escalatedItems = useMemo(() => {
    const items = allApprovals.filter((a) =>
      a.status === 'pending' && (a.type === 'escalated' || a.hoursAgo > 48 || a.priority === 'critical')
    );
    return items.sort((a, b) => {
      const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[a.priority] - prioOrder[b.priority];
      return b.hoursAgo - a.hoursAgo;
    });
  }, []);

  const breachingSLA = escalatedItems.filter((a) => a.hoursAgo > 48).length;
  const criticalCount = escalatedItems.filter((a) => a.priority === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Escalated" value={escalatedItems.length} sub="Needs attention" icon={AlertTriangle} color="#ef4444" />
        <StatCard title="Breaching SLA (>48h)" value={breachingSLA} sub="Overdue items" icon={Timer} color={breachingSLA > 0 ? '#ef4444' : undefined} />
        <StatCard title="Critical Priority" value={criticalCount} sub="Immediate action" icon={Clock} color={criticalCount > 0 ? '#ef4444' : undefined} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Priority Queue (sorted by severity + time pending)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Title</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>From</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Priority</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Waiting</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>SLA</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalatedItems.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)', backgroundColor: a.priority === 'critical' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.subType}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.from}</TableCell>
                  <TableCell>{priorityBadge(a.priority)}</TableCell>
                  <TableCell className="font-semibold" style={{ color: a.hoursAgo > 48 ? '#ef4444' : '#f59e0b' }}>{a.hoursAgo}h</TableCell>
                  <TableCell>
                    {a.hoursAgo > 48 ? (
                      <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Breached</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">Within</Badge>
                    )}
                  </TableCell>
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
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.id} &mdash; Waiting {view?.hoursAgo}h</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="From" value={view.from} />
                <DetailField label="Department" value={view.dept} />
                <div><p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Priority</p>{priorityBadge(view.priority)}</div>
                <DetailField label="Date" value={view.date} />
                {view.amount && <DetailField label="Amount" value={view.amount} />}
              </div>
              <DetailField label="Description" value={view.description} />
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="gap-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-md border-red-500/30 text-red-600 hover:bg-red-500/5"><XCircle className="h-3.5 w-3.5" /> Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
