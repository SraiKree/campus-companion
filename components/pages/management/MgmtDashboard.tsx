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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Building2, Users, DollarSign, TrendingUp, BarChart3, Search, Eye,
  GraduationCap, Landmark, Wrench, AlertTriangle, CheckCircle,
  Clock, Star, Package,
} from 'lucide-react';
import {
  departments, staffMembers, feeRecords, expenses, assets, DEPT_CODES,
} from './data';
import type { Department, StaffMember, ExpenseItem, Asset } from './data';

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  return <div><p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>{label}</p><p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{value}</p></div>;
}

function condBadge(c: string) {
  if (c === 'good') return <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">Good</Badge>;
  if (c === 'fair') return <Badge className="bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10">Fair</Badge>;
  return <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Poor</Badge>;
}

function statusBadge(s: string) {
  if (s === 'approved' || s === 'active') return <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">{s === 'active' ? 'Active' : 'Approved'}</Badge>;
  if (s === 'pending') return <Badge className="bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10">Pending</Badge>;
  if (s === 'on_leave') return <Badge className="bg-blue-500/10 text-blue-600 border-transparent hover:bg-blue-500/10">On Leave</Badge>;
  if (s === 'resigned') return <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Resigned</Badge>;
  return <Badge className="bg-red-500/10 text-red-600 border-transparent hover:bg-red-500/10">Overdue</Badge>;
}

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  const totalStudents = departments.reduce((s, d) => s + d.students, 0);
  const totalFaculty = departments.reduce((s, d) => s + d.faculty, 0);
  const totalFeeCollected = feeRecords.reduce((s, r) => s + r.collected, 0);
  const totalFeePending = feeRecords.reduce((s, r) => s + r.pending, 0);
  const overallRate = Math.round((totalFeeCollected / (totalFeeCollected + totalFeePending)) * 100);
  const pendingExpenses = expenses.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Departments" value={departments.length} sub="Active departments" icon={Building2} />
        <StatCard title="Total Staff" value={staffMembers.length} sub={`${staffMembers.filter((s) => s.role === 'faculty').length} faculty + ${staffMembers.filter((s) => s.role === 'non-teaching').length} non-teaching`} icon={Users} />
        <StatCard title="Total Students" value={totalStudents.toLocaleString()} sub="Across all departments" icon={GraduationCap} />
        <StatCard title="Fee Collection" value={`${overallRate}%`} sub={`${totalFeePending} students pending`} icon={DollarSign} color={overallRate >= 90 ? '#22c55e' : '#f59e0b'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Revenue (AY)" value="Rs.4.2 Cr" sub="Fee + grants" icon={Landmark} />
        <StatCard title="Pending Expenses" value={pendingExpenses} sub="Awaiting approval" icon={Clock} color={pendingExpenses > 0 ? '#f59e0b' : undefined} />
        <StatCard title="Assets Tracked" value={assets.length} sub={`${assets.filter((a) => a.condition === 'poor').length} need attention`} icon={Package} />
      </div>

      {/* Quick department overview */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Department Snapshot</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Students</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Faculty</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Budget Used</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.code} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><Badge variant="outline" className="font-semibold">{d.code}</Badge></TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.students}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.faculty}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={d.utilization} className="h-2 w-16" />
                      <span className="text-xs font-semibold" style={{ color: d.utilization > 85 ? '#f59e0b' : '#22c55e' }}>{d.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: d.avgAttendance < 75 ? '#ef4444' : d.avgAttendance < 80 ? '#f59e0b' : '#22c55e' }}>{d.avgAttendance}%</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: d.passRate < 80 ? '#f59e0b' : '#22c55e' }}>{d.passRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Departments ───────────────────────────────────────────────────────────────

function DepartmentsTab() {
  const [view, setView] = useState<Department | null>(null);
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Department</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>HOD</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Faculty</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Students</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Budget</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Utilization</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pass Rate</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.code} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell>
                    <div><span className="font-medium" style={{ color: 'var(--ch-text)' }}>{d.name}</span><br /><Badge variant="outline" className="text-xs mt-0.5">{d.code}</Badge></div>
                  </TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{d.hod}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.faculty}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.students}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{d.budget}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2"><Progress value={d.utilization} className="h-2 w-16" /><span className="text-xs font-semibold" style={{ color: d.utilization > 85 ? '#f59e0b' : '#22c55e' }}>{d.utilization}%</span></div>
                  </TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: d.passRate < 80 ? '#f59e0b' : '#22c55e' }}>{d.passRate}%</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(d)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.name}</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.code}</DialogDescription></DialogHeader>
          {view && <div className="grid grid-cols-2 gap-4 pt-2"><DetailField label="HOD" value={view.hod} /><DetailField label="Faculty" value={String(view.faculty)} /><DetailField label="Students" value={String(view.students)} /><DetailField label="Budget" value={view.budget} /><DetailField label="Spent" value={view.spent} /><DetailField label="Utilization" value={`${view.utilization}%`} /><DetailField label="Avg Attendance" value={`${view.avgAttendance}%`} /><DetailField label="Pass Rate" value={`${view.passRate}%`} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Staff ─────────────────────────────────────────────────────────────────────

function StaffTab() {
  const [search, setSearch] = useState('');
  const [deptFilt, setDeptFilt] = useState('All');
  const [roleFilt, setRoleFilt] = useState('All');
  const [view, setView] = useState<StaffMember | null>(null);

  const filtered = useMemo(() => staffMembers.filter((s) => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const md = deptFilt === 'All' || s.dept === deptFilt;
    const mr = roleFilt === 'All' || s.role === roleFilt;
    return ms && md && mr;
  }), [search, deptFilt, roleFilt]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Staff" value={staffMembers.length} sub="All departments" icon={Users} />
        <StatCard title="Faculty" value={staffMembers.filter((s) => s.role === 'faculty').length} sub="Teaching staff" icon={GraduationCap} />
        <StatCard title="Non-Teaching" value={staffMembers.filter((s) => s.role === 'non-teaching').length} sub="Admin & support" icon={Building2} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} /><Input placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }} /></div>
        <Select value={deptFilt} onValueChange={setDeptFilt}><SelectTrigger className="w-[130px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger><SelectContent>{DEPT_CODES.map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All Depts' : d}</SelectItem>)}</SelectContent></Select>
        <Select value={roleFilt} onValueChange={setRoleFilt}><SelectTrigger className="w-[140px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All Roles</SelectItem><SelectItem value="faculty">Faculty</SelectItem><SelectItem value="non-teaching">Non-Teaching</SelectItem></SelectContent></Select>
      </div>
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Designation</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Role</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No staff match.</TableCell></TableRow> : filtered.map((s) => (
                <TableRow key={s.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{s.id}</code></TableCell>
                  <TableCell><Badge variant="outline">{s.dept}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{s.designation}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{s.role === 'non-teaching' ? 'Non-Teaching' : 'Faculty'}</Badge></TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(s)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.name}</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.designation}</DialogDescription></DialogHeader>
          {view && <div className="grid grid-cols-2 gap-4 pt-2"><DetailField label="ID" value={view.id} /><DetailField label="Dept" value={view.dept} /><DetailField label="Role" value={view.role === 'non-teaching' ? 'Non-Teaching' : 'Faculty'} /><DetailField label="Email" value={view.email} /><DetailField label="Phone" value={view.phone} /><DetailField label="Joined" value={view.joinDate} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Finance ───────────────────────────────────────────────────────────────────

function FinanceTab() {
  const [view, setView] = useState<ExpenseItem | null>(null);
  const totalCollected = feeRecords.reduce((s, r) => s + r.collected, 0);
  const totalPending = feeRecords.reduce((s, r) => s + r.pending, 0);
  const overallRate = Math.round((totalCollected / (totalCollected + totalPending)) * 100);
  const pendingExpAmt = expenses.filter((e) => e.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Fee Collected" value={`${overallRate}%`} sub={`${totalCollected} of ${totalCollected + totalPending} students`} icon={CheckCircle} color={overallRate >= 90 ? '#22c55e' : '#f59e0b'} />
        <StatCard title="Pending Dues" value={totalPending} sub="Students with dues" icon={AlertTriangle} color={totalPending > 0 ? '#ef4444' : undefined} />
        <StatCard title="Total Revenue" value="Rs.27.2 Cr" sub="This academic year" icon={Landmark} />
        <StatCard title="Pending Expenses" value={pendingExpAmt.length} sub="Awaiting approval" icon={Clock} color={pendingExpAmt.length > 0 ? '#f59e0b' : undefined} />
      </div>

      {/* Fee collection by department */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Fee Collection by Department</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Students</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Collected</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Collected Amt</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Pending Amt</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeRecords.map((r) => (
                <TableRow key={r.dept} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><Badge variant="outline" className="font-semibold">{r.dept}</Badge></TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{r.totalStudents}</TableCell>
                  <TableCell className="text-right" style={{ color: '#22c55e' }}>{r.collected}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.pending > 0 ? '#ef4444' : 'var(--ch-text)' }}>{r.pending}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{r.collectedAmt}</TableCell>
                  <TableCell style={{ color: '#ef4444' }}>{r.pendingAmt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2"><Progress value={r.rate} className="h-2 w-16" /><span className="text-xs font-semibold" style={{ color: r.rate >= 93 ? '#22c55e' : '#f59e0b' }}>{r.rate}%</span></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Expenses & Budget</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Description</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Amount</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{e.id}</code></TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" style={{ color: 'var(--ch-text)' }}>{e.description}</TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell className="font-semibold" style={{ color: 'var(--ch-text)' }}>{e.amount}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{e.date}</TableCell>
                  <TableCell>{statusBadge(e.status)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(e)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.description}</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.id} — {view?.category}</DialogDescription></DialogHeader>
          {view && <div className="grid grid-cols-2 gap-4 pt-2"><DetailField label="Department" value={view.dept} /><DetailField label="Amount" value={view.amount} /><DetailField label="Date" value={view.date} /><DetailField label="Approved By" value={view.approvedBy} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Infrastructure ────────────────────────────────────────────────────────────

function InfrastructureTab() {
  const [catFilt, setCatFilt] = useState('All');
  const [view, setView] = useState<Asset | null>(null);
  const filtered = useMemo(() => catFilt === 'All' ? assets : assets.filter((a) => a.category === catFilt), [catFilt]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Buildings" value={assets.filter((a) => a.category === 'building').length} sub="Academic & admin" icon={Building2} />
        <StatCard title="Labs" value={assets.filter((a) => a.category === 'lab').length} sub="Research & practical" icon={Wrench} />
        <StatCard title="Equipment" value={assets.filter((a) => a.category === 'equipment').length} sub="IT & infra" icon={Package} />
        <StatCard title="Needs Attention" value={assets.filter((a) => a.condition === 'poor').length} sub="Poor condition" icon={AlertTriangle} color={assets.filter((a) => a.condition === 'poor').length > 0 ? '#ef4444' : undefined} />
      </div>

      <Select value={catFilt} onValueChange={setCatFilt}>
        <SelectTrigger className="w-[180px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="All">All Categories</SelectItem><SelectItem value="building">Buildings</SelectItem><SelectItem value="lab">Labs</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="vehicle">Vehicles</SelectItem></SelectContent>
      </Select>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Asset</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Location</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Condition</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Value</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Last Maintenance</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)', backgroundColor: a.condition === 'poor' ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.name}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.location}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{a.category}</Badge></TableCell>
                  <TableCell>{condBadge(a.condition)}</TableCell>
                  <TableCell className="font-semibold" style={{ color: 'var(--ch-text)' }}>{a.value}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{a.lastMaintenance}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(a)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader><DialogTitle style={{ color: 'var(--ch-text)' }}>{view?.name}</DialogTitle><DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.id}</DialogDescription></DialogHeader>
          {view && <div className="grid grid-cols-2 gap-4 pt-2"><DetailField label="Location" value={view.location} /><DetailField label="Category" value={view.category} /><DetailField label="Value" value={view.value} /><DetailField label="Last Maintenance" value={view.lastMaintenance} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const totalStudents = departments.reduce((s, d) => s + d.students, 0);
  const avgAtt = Math.round(departments.reduce((s, d) => s + d.avgAttendance, 0) / departments.length);
  const avgPass = Math.round(departments.reduce((s, d) => s + d.passRate, 0) / departments.length);
  const totalBudgetUtil = Math.round(departments.reduce((s, d) => s + d.utilization, 0) / departments.length);
  const feeRate = Math.round(feeRecords.reduce((s, r) => s + r.rate, 0) / feeRecords.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value={`${avgAtt}%`} sub="All departments" icon={TrendingUp} color={avgAtt < 75 ? '#f59e0b' : '#22c55e'} />
        <StatCard title="Avg Pass Rate" value={`${avgPass}%`} sub="Institution-wide" icon={CheckCircle} color={avgPass >= 85 ? '#22c55e' : '#f59e0b'} />
        <StatCard title="Avg Budget Utilization" value={`${totalBudgetUtil}%`} sub="Across departments" icon={Landmark} />
        <StatCard title="Avg Fee Collection" value={`${feeRate}%`} sub="Across departments" icon={DollarSign} color={feeRate >= 92 ? '#22c55e' : '#f59e0b'} />
      </div>

      {/* Department comparison */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Department Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Attendance</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Pass Rate</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Fee Collection</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Budget Used</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => {
                const fee = feeRecords.find((f) => f.dept === d.code);
                const score = Math.round((d.avgAttendance + d.passRate + (fee?.rate || 0)) / 3);
                return (
                  <TableRow key={d.code} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell><Badge variant="outline" className="font-semibold">{d.code}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={d.avgAttendance} className="h-2 w-16" /><span className="text-xs font-semibold" style={{ color: d.avgAttendance < 75 ? '#ef4444' : '#22c55e' }}>{d.avgAttendance}%</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={d.passRate} className="h-2 w-16" /><span className="text-xs font-semibold" style={{ color: d.passRate < 80 ? '#f59e0b' : '#22c55e' }}>{d.passRate}%</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={fee?.rate || 0} className="h-2 w-16" /><span className="text-xs font-semibold" style={{ color: (fee?.rate || 0) < 92 ? '#f59e0b' : '#22c55e' }}>{fee?.rate || 0}%</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={d.utilization} className="h-2 w-16" /><span className="text-xs font-semibold">{d.utilization}%</span></div></TableCell>
                    <TableCell>
                      <Badge style={{
                        backgroundColor: score >= 88 ? '#22c55e15' : score >= 82 ? '#3b82f615' : '#f59e0b15',
                        color: score >= 88 ? '#22c55e' : score >= 82 ? '#3b82f6' : '#f59e0b',
                        borderColor: 'transparent',
                      }}>{score}% — {score >= 88 ? 'Excellent' : score >= 82 ? 'Good' : 'Average'}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff distribution */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>Staff Distribution</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Department</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Faculty</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Students</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Student:Faculty Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => {
                const ratio = Math.round(d.students / d.faculty);
                return (
                  <TableRow key={d.code} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell><Badge variant="outline" className="font-semibold">{d.code}</Badge></TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.faculty}</TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.students}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: ratio > 20 ? '#f59e0b' : '#22c55e' }}>{ratio}:1</TableCell>
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
  overview:        { title: 'Management Dashboard', sub: 'Institutional operations, finance & infrastructure overview' },
  departments:     { title: 'Departments', sub: 'Performance, budgets & HOD assignments' },
  staff:           { title: 'Staff Directory', sub: 'Faculty and non-teaching staff records' },
  finance:         { title: 'Finance', sub: 'Fee collection, expenses & budget tracking' },
  infrastructure:  { title: 'Infrastructure & Assets', sub: 'Buildings, labs, equipment & maintenance' },
  analytics:       { title: 'Analytics & Reports', sub: 'Department comparisons, trends & insights' },
};

interface MgmtDashboardProps {
  defaultTab?: string;
}

export default function MgmtDashboard({ defaultTab = 'overview' }: MgmtDashboardProps) {
  const info = TAB_TITLES[defaultTab] || TAB_TITLES.overview;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{info.title}</h1>
        <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>{info.sub}</p>
      </div>
      {defaultTab === 'overview' && <OverviewTab />}
      {defaultTab === 'departments' && <DepartmentsTab />}
      {defaultTab === 'staff' && <StaffTab />}
      {defaultTab === 'finance' && <FinanceTab />}
      {defaultTab === 'infrastructure' && <InfrastructureTab />}
      {defaultTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
