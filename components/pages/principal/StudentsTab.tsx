'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Search, Eye, AlertTriangle, ShieldAlert, FileText, Bell,
  GraduationCap, BookOpen, DollarSign, Calendar,
} from 'lucide-react';
import { studentRecords, DEPARTMENTS } from './data';
import type { StudentRecord, RiskLevel } from './data';
import { riskBadge, statusBadge, DetailField } from './ui-helpers';

function attColor(pct: number) {
  if (pct >= 85) return '#22c55e';
  if (pct >= 75) return 'var(--ch-text)';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function statusLabel(s: string) {
  if (s === 'probation') return <Badge className="bg-orange-500/10 text-orange-600 border-transparent hover:bg-orange-500/10">Probation</Badge>;
  if (s === 'suspended') return <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Suspended</Badge>;
  return <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">Active</Badge>;
}

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const [deptFilt, setDeptFilt] = useState('All');
  const [yearFilt, setYearFilt] = useState('All');
  const [riskFilt, setRiskFilt] = useState('All');
  const [statusFilt, setStatusFilt] = useState('All');
  const [selected, setSelected] = useState<StudentRecord | null>(null);

  const filtered = useMemo(() => {
    return studentRecords.filter((s) => {
      const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
      const md = deptFilt === 'All' || s.dept === deptFilt;
      const my = yearFilt === 'All' || s.year === yearFilt;
      const mr = riskFilt === 'All' || s.risk === riskFilt;
      const mst = statusFilt === 'All' || s.status === statusFilt;
      return ms && md && my && mr && mst;
    });
  }, [search, deptFilt, yearFilt, riskFilt, statusFilt]);

  const riskCounts = {
    high: studentRecords.filter((s) => s.risk === 'high').length,
    medium: studentRecords.filter((s) => s.risk === 'medium').length,
    low: studentRecords.filter((s) => s.risk === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Risk summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl border cursor-pointer" style={{ backgroundColor: 'var(--ch-card)', borderColor: riskFilt === 'high' ? '#ef4444' : 'var(--ch-border)' }} onClick={() => setRiskFilt(riskFilt === 'high' ? 'All' : 'high')}>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{riskCounts.high}</p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>High Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border cursor-pointer" style={{ backgroundColor: 'var(--ch-card)', borderColor: riskFilt === 'medium' ? '#f59e0b' : 'var(--ch-border)' }} onClick={() => setRiskFilt(riskFilt === 'medium' ? 'All' : 'medium')}>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/10"><ShieldAlert className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{riskCounts.medium}</p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Medium Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border cursor-pointer" style={{ backgroundColor: 'var(--ch-card)', borderColor: riskFilt === 'low' ? '#22c55e' : 'var(--ch-border)' }} onClick={() => setRiskFilt(riskFilt === 'low' ? 'All' : 'low')}>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10"><GraduationCap className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{riskCounts.low}</p>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Low Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
          <Input placeholder="Search name or roll..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} />
        </div>
        <Select value={deptFilt} onValueChange={setDeptFilt}>
          <SelectTrigger className="w-[130px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{DEPARTMENTS.filter((d) => d !== 'Admin').map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={yearFilt} onValueChange={setYearFilt}>
          <SelectTrigger className="w-[120px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{['All', '1st', '2nd', '3rd', '4th'].map((y) => <SelectItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilt} onValueChange={setStatusFilt}>
          <SelectTrigger className="w-[130px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{['All', 'active', 'probation', 'suspended'].map((s) => <SelectItem key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Directory table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>CGPA</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Attendance</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Risk</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Flags</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No students match filters.</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id} style={{ borderColor: 'var(--ch-border)', backgroundColor: s.risk === 'high' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{s.roll}</code></TableCell>
                  <TableCell><Badge variant="outline">{s.dept}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{s.year}</TableCell>
                  <TableCell style={{ color: s.cgpa < 6.5 ? '#ef4444' : 'var(--ch-text)' }} className="font-semibold">{s.cgpa.toFixed(1)}</TableCell>
                  <TableCell style={{ color: attColor(s.attendance) }} className="font-semibold">{s.attendance}%</TableCell>
                  <TableCell>{statusLabel(s.status)}</TableCell>
                  <TableCell>{riskBadge(s.risk)}</TableCell>
                  <TableCell>
                    {s.flags.length > 0 ? (
                      <span className="text-xs font-medium" style={{ color: '#ef4444' }}>{s.flags.length} flag{s.flags.length > 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(s)}>
                      <Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Student Profile Drawer ── */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle style={{ color: 'var(--ch-text)' }}>{selected.name}</SheetTitle>
                <SheetDescription style={{ color: 'var(--ch-muted)' }}>{selected.roll} &mdash; {selected.dept}, {selected.year} Year</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-6">
                {/* ── Decision Summary Card ── */}
                <Card className="rounded-xl border" style={{
                  borderColor: selected.risk === 'high' ? '#ef4444' : selected.risk === 'medium' ? '#f59e0b' : '#22c55e',
                  backgroundColor: selected.risk === 'high' ? 'rgba(239,68,68,0.04)' : selected.risk === 'medium' ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)',
                }}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Decision Summary</span>
                      {riskBadge(selected.risk)}
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{selected.riskReason}</p>
                    <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      <strong>Suggested:</strong> {selected.suggestedAction}
                    </p>
                  </CardContent>
                </Card>

                {/* ── Flags ── */}
                {selected.flags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Alerts / Flags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.flags.map((f, i) => (
                        <Badge key={i} className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10 text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Key Metrics ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Key Metrics</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                      <p className="text-lg font-bold" style={{ color: selected.cgpa < 6.5 ? '#ef4444' : 'var(--ch-text)' }}>{selected.cgpa}</p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>CGPA</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                      <p className="text-lg font-bold" style={{ color: attColor(selected.attendance) }}>{selected.attendance}%</p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Attendance</p>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                      <p className="text-lg font-bold" style={{ color: selected.backlogs > 0 ? '#ef4444' : 'var(--ch-text)' }}>{selected.backlogs}</p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Backlogs</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span style={{ color: 'var(--ch-muted)' }}>Attendance</span><span style={{ color: attColor(selected.attendance) }}>{selected.attendance}%</span></div>
                    <Progress value={selected.attendance} className="h-2" />
                  </div>
                </div>

                <Separator style={{ backgroundColor: 'var(--ch-border)' }} />

                {/* ── Basic Info ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Basic Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Email" value={selected.email} />
                    <DetailField label="Phone" value={selected.phone} />
                    <DetailField label="Type" value={selected.hostel ? 'Hosteler' : 'Day Scholar'} />
                    <div><p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Status</p>{statusLabel(selected.status)}</div>
                  </div>
                </div>

                <Separator style={{ backgroundColor: 'var(--ch-border)' }} />

                {/* ── Financial Snapshot ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Financial Snapshot</p>
                  <div className="grid grid-cols-3 gap-3">
                    <DetailField label="Fees Paid" value={selected.feesPaid} />
                    <DetailField label="Pending" value={selected.feesPending} />
                    <DetailField label="Scholarships" value={selected.scholarships} />
                  </div>
                </div>

                <Separator style={{ backgroundColor: 'var(--ch-border)' }} />

                {/* ── Request History ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Request History</p>
                  {selected.recentRequests.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No recent requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.recentRequests.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{r.type}</p>
                            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{r.date} &middot; {r.approvedBy}</p>
                          </div>
                          {statusBadge(r.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator style={{ backgroundColor: 'var(--ch-border)' }} />

                {/* ── Principal Actions ── */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>Principal Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs justify-start">
                      <FileText className="h-3.5 w-3.5" /> Approve Special Case
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs justify-start border-red-500/30 text-red-600 hover:bg-red-500/5">
                      <ShieldAlert className="h-3.5 w-3.5" /> Reject / Flag
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs justify-start">
                      <BookOpen className="h-3.5 w-3.5" /> Add Disciplinary Note
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs justify-start">
                      <Bell className="h-3.5 w-3.5" /> Send Notice
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
