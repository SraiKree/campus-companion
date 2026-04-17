'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Status, Priority, RiskLevel } from './data';

export function statusBadge(s: Status) {
  const m: Record<Status, { cls: string; label: string }> = {
    pending:   { cls: 'bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10', label: 'Pending' },
    approved:  { cls: 'bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10', label: 'Approved' },
    rejected:  { cls: 'bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10', label: 'Rejected' },
    delegated: { cls: 'bg-blue-500/10 text-blue-600 border-transparent hover:bg-blue-500/10', label: 'Delegated' },
  };
  const v = m[s];
  return <Badge className={v.cls}>{v.label}</Badge>;
}

export function priorityBadge(p: Priority) {
  const m: Record<Priority, { cls: string }> = {
    critical: { cls: 'bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10' },
    high:     { cls: 'bg-orange-500/10 text-orange-600 border-transparent hover:bg-orange-500/10' },
    medium:   { cls: 'bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10' },
    low:      { cls: 'bg-gray-500/10 text-gray-600 border-transparent hover:bg-gray-500/10' },
  };
  return <Badge className={m[p].cls}>{p.charAt(0).toUpperCase() + p.slice(1)}</Badge>;
}

export function riskBadge(r: RiskLevel) {
  const m: Record<RiskLevel, { cls: string }> = {
    high:   { cls: 'bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10' },
    medium: { cls: 'bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10' },
    low:    { cls: 'bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10' },
  };
  return <Badge className={m[r].cls}>{r.charAt(0).toUpperCase() + r.slice(1)} Risk</Badge>;
}

export function StatCard({ title, value, sub, icon: Icon, color, onClick }: {
  title: string; value: string | number; sub: string; icon: React.ElementType; color?: string; onClick?: () => void;
}) {
  return (
    <Card
      className={`rounded-2xl border${onClick ? ' cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>{title}</CardTitle>
        <Icon className="h-4 w-4" style={{ color: color || 'var(--ch-accent)' }} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: color || 'var(--ch-text)' }}>{value}</div>
        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{sub}</p>
      </CardContent>
    </Card>
  );
}

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{value}</p>
    </div>
  );
}
