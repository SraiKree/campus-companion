'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, XCircle, BarChart3, CheckCircle } from 'lucide-react';
import { allApprovals, TYPE_LABELS } from './data';
import { StatCard } from './ui-helpers';

export default function ReportsTab() {
  const pending = allApprovals.filter((a) => a.status === 'pending');
  const decided = allApprovals.filter((a) => a.status !== 'pending');
  const approved = allApprovals.filter((a) => a.status === 'approved');
  const rejected = allApprovals.filter((a) => a.status === 'rejected');
  const avgTime = decided.length > 0 ? Math.round(decided.reduce((s, a) => s + a.hoursAgo, 0) / decided.length) : 0;
  const slaCompliance = decided.length > 0 ? Math.round((decided.filter((a) => a.hoursAgo <= 48).length / decided.length) * 100) : 100;

  // Department-wise load
  const deptLoad = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'Admin', 'All'].map((dept) => {
    const items = allApprovals.filter((a) => a.dept === dept);
    if (items.length === 0) return null;
    return {
      dept,
      total: items.length,
      pending: items.filter((a) => a.status === 'pending').length,
      approved: items.filter((a) => a.status === 'approved').length,
      rejected: items.filter((a) => a.status === 'rejected').length,
    };
  }).filter(Boolean) as { dept: string; total: number; pending: number; approved: number; rejected: number }[];

  // Type-wise breakdown
  const typeBreakdown = (['academic', 'student', 'financial', 'event', 'escalated'] as const).map((type) => {
    const items = allApprovals.filter((a) => a.type === type);
    const pend = items.filter((a) => a.status === 'pending');
    const dec = items.filter((a) => a.status !== 'pending');
    return {
      type: TYPE_LABELS[type],
      total: items.length,
      pending: pend.length,
      avgWait: pend.length > 0 ? Math.round(pend.reduce((s, a) => s + a.hoursAgo, 0) / pend.length) : 0,
      rejRate: dec.length > 0 ? Math.round((items.filter((a) => a.status === 'rejected').length / dec.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Avg Turnaround" value={`${avgTime}h`} sub="Time to decision" icon={Timer} />
        <StatCard title="SLA Compliance" value={`${slaCompliance}%`} sub="Decided within 48h" icon={CheckCircle} color={slaCompliance >= 80 ? '#22c55e' : '#f59e0b'} />
        <StatCard title="Rejection Rate" value={`${decided.length > 0 ? Math.round((rejected.length / decided.length) * 100) : 0}%`} sub={`${rejected.length} of ${decided.length}`} icon={XCircle} />
        <StatCard title="Total Processed" value={decided.length} sub={`${pending.length} still pending`} icon={BarChart3} />
      </div>

      {/* SLA compliance bar */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>SLA Compliance</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--ch-muted)' }}>Target: 48 hours</span>
            <span className="font-semibold" style={{ color: slaCompliance >= 80 ? '#22c55e' : '#f59e0b' }}>{slaCompliance}%</span>
          </div>
          <Progress value={slaCompliance} className="h-3" />
        </CardContent>
      </Card>

      {/* Approval turnaround by type */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Turnaround by Category</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Avg Wait (h)</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Rejection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeBreakdown.map((r) => (
                <TableRow key={r.type} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{r.type}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{r.total}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.pending > 0 ? '#f59e0b' : '#22c55e' }}>{r.pending}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.avgWait > 48 ? '#ef4444' : 'var(--ch-text)' }}>{r.avgWait || '—'}</TableCell>
                  <TableCell className="text-right" style={{ color: r.rejRate > 20 ? '#ef4444' : 'var(--ch-text)' }}>{r.rejRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department-wise load */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Department-wise Load</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Department</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Approved</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptLoad.map((r) => (
                <TableRow key={r.dept} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><Badge variant="outline" className="font-medium">{r.dept}</Badge></TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{r.total}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.pending > 0 ? '#f59e0b' : '#22c55e' }}>{r.pending}</TableCell>
                  <TableCell className="text-right" style={{ color: '#22c55e' }}>{r.approved}</TableCell>
                  <TableCell className="text-right" style={{ color: r.rejected > 0 ? '#ef4444' : 'var(--ch-text)' }}>{r.rejected}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
