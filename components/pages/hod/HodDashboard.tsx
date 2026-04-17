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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Users, GraduationCap, TrendingUp, Calendar, Search, Eye,
  AlertTriangle, CheckCircle, XCircle, Clock, Star, BarChart3,
  BookOpen, FileText, Timer,
} from 'lucide-react';
import {
  DEPT, students, faculty, approvals, attendanceRecords, TYPE_LABELS,
} from './data';
import type { DeptStudent, DeptFaculty, ApprovalReq, Status } from './data';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function attColor(pct: number) {
  if (pct >= 85) return '#22c55e';
  if (pct >= 75) return 'var(--ch-text)';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function statusBadge(s: Status) {
  const m: Record<Status, { cls: string; label: string }> = {
    pending: { cls: 'bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10', label: 'Pending' },
    approved: { cls: 'bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10', label: 'Approved' },
    rejected: { cls: 'bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10', label: 'Rejected' },
  };
  const v = m[s];
  return <Badge className={v.cls}>{v.label}</Badge>;
}

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub: string; icon: React.ElementType; color?: string;
}) {
  return (
    <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{value}</p>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  const lowAtt = students.filter((s) => s.attendance < 75).length;
  const avgAtt = Math.round(students.reduce((s, c) => s + c.attendance, 0) / students.length);
  const probation = students.filter((s) => s.status === 'probation' || s.status === 'detained').length;
  const pendingAppr = approvals.filter((a) => a.status === 'pending').length;
  const avgGpa = (students.reduce((s, c) => s + c.gpa, 0) / students.length).toFixed(1);
  const topperName = students.reduce((a, b) => a.gpa > b.gpa ? a : b).name;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Dept Students" value={students.length} sub={`${DEPT} Department`} icon={GraduationCap} />
        <StatCard title="Dept Faculty" value={faculty.length} sub="Teaching staff" icon={Users} />
        <StatCard title="Avg Attendance" value={`${avgAtt}%`} sub={`${lowAtt} below 75%`} icon={TrendingUp} color={avgAtt < 75 ? '#f59e0b' : undefined} />
        <StatCard title="Pending Approvals" value={pendingAppr} sub="Awaiting action" icon={Clock} color={pendingAppr > 0 ? '#f59e0b' : undefined} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardContent className="py-4">
            <p className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Dept Avg GPA</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>{avgGpa}</p>
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Topper: {topperName}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardContent className="py-4">
            <p className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>At-Risk Students</p>
            <p className="text-2xl font-bold" style={{ color: probation > 0 ? '#ef4444' : 'var(--ch-text)' }}>{probation}</p>
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Probation / Detained</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardContent className="py-4">
            <p className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>Total Backlogs</p>
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{students.reduce((s, c) => s + c.backlogs, 0)}</p>
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Across {students.filter((s) => s.backlogs > 0).length} students</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowAtt > 0 || probation > 0) && (
        <Card className="rounded-2xl border border-red-500/20" style={{ backgroundColor: 'var(--ch-card)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-500"><AlertTriangle className="h-4 w-4" /> Department Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {lowAtt > 0 && <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{lowAtt} students have attendance below 75%</p>}
            {probation > 0 && <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{probation} students on probation/detained status</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Students ──────────────────────────────────────────────────────────────────

function StudentsTab() {
  const [search, setSearch] = useState('');
  const [yearFilt, setYearFilt] = useState('All');
  const [statusFilt, setStatusFilt] = useState('All');
  const [selected, setSelected] = useState<DeptStudent | null>(null);

  const filtered = useMemo(() => students.filter((s) => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
    const my = yearFilt === 'All' || s.year === yearFilt;
    const mst = statusFilt === 'All' || s.status === statusFilt;
    return ms && my && mst;
  }), [search, yearFilt, statusFilt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
          <Input placeholder="Search name or roll..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} />
        </div>
        <Select value={yearFilt} onValueChange={setYearFilt}>
          <SelectTrigger className="w-[120px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{['All', '1st', '2nd', '3rd', '4th'].map((y) => <SelectItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilt} onValueChange={setStatusFilt}>
          <SelectTrigger className="w-[130px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
          <SelectContent>{['All', 'active', 'probation', 'detained'].map((s) => <SelectItem key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year/Sec</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>GPA</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Backlogs</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Flags</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No students match.</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.roll} style={{ borderColor: 'var(--ch-border)', backgroundColor: s.status !== 'active' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{s.roll}</code></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{s.year} — {s.section}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: attColor(s.attendance) }}>{s.attendance}%</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: s.gpa < 6.5 ? '#ef4444' : 'var(--ch-text)' }}>{s.gpa.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: s.backlogs > 0 ? '#ef4444' : 'var(--ch-text)' }}>{s.backlogs}</TableCell>
                  <TableCell>
                    {s.status === 'probation' ? <Badge className="bg-orange-500/10 text-orange-600 border-transparent hover:bg-orange-500/10">Probation</Badge>
                      : s.status === 'detained' ? <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Detained</Badge>
                      : <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">Active</Badge>}
                  </TableCell>
                  <TableCell>{s.flags.length > 0 ? <span className="text-xs font-medium" style={{ color: '#ef4444' }}>{s.flags.length}</span> : <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>—</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(s)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          {selected && (<>
            <SheetHeader>
              <SheetTitle style={{ color: 'var(--ch-text)' }}>{selected.name}</SheetTitle>
              <SheetDescription style={{ color: 'var(--ch-muted)' }}>{selected.roll} — {DEPT}, {selected.year} Year, Section {selected.section}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 mt-6">
              {selected.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">{selected.flags.map((f, i) => <Badge key={i} className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10 text-xs">{f}</Badge>)}</div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <p className="text-lg font-bold" style={{ color: attColor(selected.attendance) }}>{selected.attendance}%</p>
                  <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Attendance</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                  <p className="text-lg font-bold" style={{ color: selected.gpa < 6.5 ? '#ef4444' : 'var(--ch-text)' }}>{selected.gpa}</p>
                  <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>GPA</p>
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
              <Separator style={{ backgroundColor: 'var(--ch-border)' }} />
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Email" value={selected.email} />
                <DetailField label="Phone" value={selected.phone} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs"><FileText className="h-3.5 w-3.5" /> Send Warning</Button>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs border-red-500/30 text-red-600 hover:bg-red-500/5"><AlertTriangle className="h-3.5 w-3.5" /> Escalate to Principal</Button>
              </div>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Faculty ───────────────────────────────────────────────────────────────────

function FacultyTab() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<DeptFaculty | null>(null);
  const filtered = useMemo(() => {
    if (!search) return faculty;
    const q = search.toLowerCase();
    return faculty.filter((f) => f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
        <Input placeholder="Search name or subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} />
      </div>
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Classes</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Completion</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Rating</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => {
                const pct = Math.round((f.classesTaken / f.totalClasses) * 100);
                return (
                  <TableRow key={f.facultyId} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{f.name}</TableCell>
                    <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{f.facultyId}</code></TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{f.subject}</TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{f.classesTaken}/{f.totalClasses}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2 w-16" />
                        <span className="text-xs font-medium" style={{ color: pct < 80 ? '#f59e0b' : '#22c55e' }}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{f.rating.toFixed(1)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(f)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.name}</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.facultyId} — {view?.qualification}</DialogDescription></DialogHeader>
          {view && <div className="grid grid-cols-2 gap-4 pt-2"><DetailField label="Subject" value={view.subject} /><DetailField label="Classes" value={`${view.classesTaken} / ${view.totalClasses}`} /><DetailField label="Email" value={view.email} /><DetailField label="Phone" value={view.phone} /><DetailField label="Rating" value={`${view.rating} / 5.0`} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Approvals ─────────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const [typeFilt, setTypeFilt] = useState('All');
  const [statusFilt, setStatusFilt] = useState('pending');
  const [view, setView] = useState<ApprovalReq | null>(null);

  const filtered = useMemo(() => approvals.filter((a) => {
    const mt = typeFilt === 'All' || a.type === typeFilt;
    const ms = statusFilt === 'all' || a.status === statusFilt;
    return mt && ms;
  }), [typeFilt, statusFilt]);

  const pending = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => {
          const active = statusFilt === s;
          const count = s === 'all' ? approvals.length : approvals.filter((a) => a.status === s).length;
          return (
            <Button key={s} variant={active ? 'default' : 'outline'} size="sm" className="rounded-lg gap-1.5"
              style={active ? { backgroundColor: 'var(--ch-accent)', color: 'white' } : {}}
              onClick={() => setStatusFilt(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} <span className="text-xs opacity-70">({count})</span>
            </Button>
          );
        })}
      </div>

      <Select value={typeFilt} onValueChange={setTypeFilt}>
        <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>From</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Priority</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No requests match.</TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)', backgroundColor: a.priority === 'high' && a.status === 'pending' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.id}</code></TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" style={{ color: 'var(--ch-text)' }}>{a.subject}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[a.type]}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.from}</TableCell>
                  <TableCell>
                    <Badge className={a.priority === 'high' ? 'bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10' : a.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10' : 'bg-gray-500/10 text-gray-600 border-transparent hover:bg-gray-500/10'}>
                      {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.date}</TableCell>
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

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.subject}</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.id} — {view && TYPE_LABELS[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="From" value={view.from} />
                {view.roll && <DetailField label="Roll No" value={view.roll} />}
                <DetailField label="Date" value={view.date} />
                <DetailField label="Priority" value={view.priority.charAt(0).toUpperCase() + view.priority.slice(1)} />
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

// ── Attendance ─────────────────────────────────────────────────────────────────

function AttendanceTab() {
  const overall = Math.round(attendanceRecords.reduce((s, r) => s + r.avgAttendance, 0) / attendanceRecords.length);
  const totalBelow75 = attendanceRecords.reduce((s, r) => s + r.below75, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Dept Avg Attendance" value={`${overall}%`} sub="Across all subjects" icon={Calendar} color={attColor(overall)} />
        <StatCard title="Students Below 75%" value={totalBelow75} sub="Need attention (sum across subjects)" icon={AlertTriangle} color={totalBelow75 > 0 ? '#ef4444' : undefined} />
        <StatCard title="Subjects Monitored" value={attendanceRecords.length} sub={`${DEPT} Department`} icon={BookOpen} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Subject-wise Attendance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Code</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Faculty</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Classes</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Avg Attendance</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>&lt;75%</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>&lt;60%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((r) => (
                <TableRow key={r.subjectCode} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{r.subject}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{r.subjectCode}</code></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{r.faculty}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{r.totalClasses}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.avgAttendance} className="h-2 w-20" />
                      <span className="text-xs font-semibold" style={{ color: attColor(r.avgAttendance) }}>{r.avgAttendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.below75 > 0 ? '#f59e0b' : 'var(--ch-text)' }}>{r.below75}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.below60 > 0 ? '#ef4444' : 'var(--ch-text)' }}>{r.below60}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low attendance student list */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-500"><AlertTriangle className="h-4 w-4" /> Students Below 75% Attendance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.filter((s) => s.attendance < 75).sort((a, b) => a.attendance - b.attendance).map((s) => (
                <TableRow key={s.roll} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{s.roll}</code></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{s.year}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: attColor(s.attendance) }}>{s.attendance}%</TableCell>
                  <TableCell>
                    {s.attendance < 60 ? <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Critical</Badge>
                      : <Badge className="bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10">Warning</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────

function ReportsTab() {
  const totalStudents = students.length;
  const avgAtt = Math.round(students.reduce((s, c) => s + c.attendance, 0) / totalStudents);
  const avgGpa = (students.reduce((s, c) => s + c.gpa, 0) / totalStudents).toFixed(2);
  const passRate = Math.round((students.filter((s) => s.backlogs === 0).length / totalStudents) * 100);
  const approvalRate = approvals.length > 0 ? Math.round((approvals.filter((a) => a.status === 'approved').length / approvals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Dept Avg GPA" value={avgGpa} sub={`${DEPT} Department`} icon={GraduationCap} />
        <StatCard title="Avg Attendance" value={`${avgAtt}%`} sub="All students" icon={Calendar} color={attColor(avgAtt)} />
        <StatCard title="Pass Rate" value={`${passRate}%`} sub="No backlogs" icon={CheckCircle} color={passRate >= 80 ? '#22c55e' : '#f59e0b'} />
        <StatCard title="Approval Rate" value={`${approvalRate}%`} sub={`${approvals.filter((a) => a.status === 'approved').length} of ${approvals.length}`} icon={FileText} />
      </div>

      {/* Year-wise breakdown */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Year-wise Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Students</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Avg GPA</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Avg Attendance</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Backlogs</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>At-Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['1st', '2nd', '3rd', '4th'].map((year) => {
                const ys = students.filter((s) => s.year === year);
                if (ys.length === 0) return null;
                const yAvgGpa = (ys.reduce((s, c) => s + c.gpa, 0) / ys.length).toFixed(1);
                const yAvgAtt = Math.round(ys.reduce((s, c) => s + c.attendance, 0) / ys.length);
                const yBacklogs = ys.reduce((s, c) => s + c.backlogs, 0);
                const yRisk = ys.filter((s) => s.status !== 'active').length;
                return (
                  <TableRow key={year} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{year} Year</TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{ys.length}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: 'var(--ch-text)' }}>{yAvgGpa}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: attColor(yAvgAtt) }}>{yAvgAtt}%</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: yBacklogs > 0 ? '#ef4444' : 'var(--ch-text)' }}>{yBacklogs}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: yRisk > 0 ? '#ef4444' : '#22c55e' }}>{yRisk}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Faculty workload */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Faculty Workload & Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Faculty</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Syllabus Completion</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Class Avg Attendance</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.map((f) => {
                const att = attendanceRecords.find((r) => r.faculty === f.name);
                const pct = Math.round((f.classesTaken / f.totalClasses) * 100);
                return (
                  <TableRow key={f.facultyId} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{f.name}</TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{f.subject}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2 w-20" />
                        <span className="text-xs font-semibold" style={{ color: pct >= 90 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {att ? (
                        <span className="font-semibold" style={{ color: attColor(att.avgAttendance) }}>{att.avgAttendance}%</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{f.rating.toFixed(1)}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval breakdown */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Approval Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Request Type</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Approved</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(TYPE_LABELS).map(([key, label]) => {
                const items = approvals.filter((a) => a.type === key);
                if (items.length === 0) return null;
                return (
                  <TableRow key={key} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{label}</TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{items.length}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: items.filter((a) => a.status === 'pending').length > 0 ? '#f59e0b' : '#22c55e' }}>{items.filter((a) => a.status === 'pending').length}</TableCell>
                    <TableCell className="text-right" style={{ color: '#22c55e' }}>{items.filter((a) => a.status === 'approved').length}</TableCell>
                    <TableCell className="text-right" style={{ color: items.filter((a) => a.status === 'rejected').length > 0 ? '#ef4444' : 'var(--ch-text)' }}>{items.filter((a) => a.status === 'rejected').length}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TAB_TITLES: Record<string, { title: string; sub: string }> = {
  overview:   { title: 'Department Head Dashboard', sub: `${DEPT} Department — manage faculty, students, and approvals` },
  students:   { title: 'Students', sub: `${DEPT} student directory with performance metrics` },
  faculty:    { title: 'Faculty', sub: `${DEPT} faculty workload and performance` },
  attendance: { title: 'Attendance Management', sub: `Subject-wise attendance across ${DEPT}` },
  reports:    { title: 'Reports & Analytics', sub: `${DEPT} department performance reports` },
  approvals:  { title: 'Approvals', sub: 'Leave requests, grade reviews, course approvals, and more' },
};

interface HodDashboardProps {
  defaultTab?: string;
}

export default function HodDashboard({ defaultTab = 'overview' }: HodDashboardProps) {
  const info = TAB_TITLES[defaultTab] || TAB_TITLES.overview;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{info.title}</h1>
        <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>{info.sub}</p>
      </div>
      {defaultTab === 'overview' && <OverviewTab />}
      {defaultTab === 'students' && <StudentsTab />}
      {defaultTab === 'faculty' && <FacultyTab />}
      {defaultTab === 'attendance' && <AttendanceTab />}
      {defaultTab === 'reports' && <ReportsTab />}
      {defaultTab === 'approvals' && <ApprovalsTab />}
    </div>
  );
}
