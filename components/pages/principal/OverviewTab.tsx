'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, AlertTriangle, CheckCircle, TrendingUp, BarChart3, ArrowRight,
  Timer, XCircle, Users, GraduationCap,
} from 'lucide-react';
import { allApprovals, TYPE_LABELS } from './data';
import { StatCard, statusBadge, priorityBadge } from './ui-helpers';

export default function OverviewTab() {
  const pending = allApprovals.filter((a) => a.status === 'pending');
  const urgent = pending.filter((a) => a.hoursAgo > 48);
  const critical = pending.filter((a) => a.priority === 'critical');
  const recentDecisions = allApprovals.filter((a) => a.status !== 'pending').slice(0, 5);

  const totalDecided = allApprovals.filter((a) => a.status !== 'pending').length;
  const rejected = allApprovals.filter((a) => a.status === 'rejected').length;
  const rejRate = totalDecided > 0 ? Math.round((rejected / totalDecided) * 100) : 0;
  const avgHours = Math.round(allApprovals.filter((a) => a.status !== 'pending').reduce((s, a) => s + a.hoursAgo, 0) / Math.max(totalDecided, 1));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approvals" value={pending.length} sub={`${critical.length} critical`} icon={Clock} color={pending.length > 0 ? '#f59e0b' : undefined} />
        <StatCard title="Urgent (>48 hrs)" value={urgent.length} sub="Breaching SLA" icon={AlertTriangle} color={urgent.length > 0 ? '#ef4444' : undefined} />
        <StatCard title="Avg Decision Time" value={`${avgHours}h`} sub="Across all types" icon={Timer} />
        <StatCard title="Rejection Rate" value={`${rejRate}%`} sub={`${rejected} of ${totalDecided} decided`} icon={XCircle} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button className="gap-2 rounded-lg" style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
          <Clock className="h-4 w-4" /> View All Pending ({pending.length})
        </Button>
        {urgent.length > 0 && (
          <Button variant="outline" className="gap-2 rounded-lg border-red-500/30 text-red-600 hover:bg-red-500/5">
            <AlertTriangle className="h-4 w-4" /> Handle Escalations ({urgent.length})
          </Button>
        )}
      </div>

      {/* Critical items requiring immediate attention */}
      {critical.length > 0 && (
        <Card className="rounded-2xl border border-red-500/20" style={{ backgroundColor: 'var(--ch-card)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" /> Critical Items ({critical.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Title</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>From</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Waiting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {critical.map((a) => (
                  <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.title}</TableCell>
                    <TableCell><Badge variant="outline">{TYPE_LABELS[a.type]}</Badge></TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{a.from}</TableCell>
                    <TableCell style={{ color: a.hoursAgo > 48 ? '#ef4444' : '#f59e0b' }}>{a.hoursAgo}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approval pipeline by category */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle style={{ color: 'var(--ch-text)' }}>Pipeline by Category</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Approved</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Urgent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(['academic', 'student', 'financial', 'event', 'escalated'] as const).map((type) => {
                const items = allApprovals.filter((a) => a.type === type);
                const pend = items.filter((a) => a.status === 'pending').length;
                const appr = items.filter((a) => a.status === 'approved').length;
                const urg = items.filter((a) => a.status === 'pending' && a.hoursAgo > 48).length;
                return (
                  <TableRow key={type} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{TYPE_LABELS[type]}</TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{items.length}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: pend > 0 ? '#f59e0b' : '#22c55e' }}>{pend}</TableCell>
                    <TableCell className="text-right" style={{ color: '#22c55e' }}>{appr}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: urg > 0 ? '#ef4444' : 'var(--ch-text)' }}>{urg}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent decisions */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle style={{ color: 'var(--ch-text)' }}>Recent Decisions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Title</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDecisions.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.title}</TableCell>
                  <TableCell><Badge variant="outline">{TYPE_LABELS[a.type]}</Badge></TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
