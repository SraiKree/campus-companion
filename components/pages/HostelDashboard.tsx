'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  BedDouble, Users, UtensilsCrossed, Wrench, ShieldAlert, UserCheck,
  AlertTriangle, CheckCircle, Clock, Search, Eye, TrendingUp,
  Zap, Droplets, Armchair, Ban, DoorOpen, Moon as MoonIcon, CalendarDays, Siren,
  ArrowUpRight,
} from 'lucide-react';

// ── Status helpers ─────────────────────────────────────────────────────────────

type Status = 'pending' | 'approved' | 'rejected' | 'resolved' | 'in_progress';

function statusBadge(s: Status) {
  const map: Record<Status, { bg: string; text: string; label: string }> = {
    pending:     { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Pending' },
    approved:    { bg: 'bg-green-500/10',  text: 'text-green-600',  label: 'Approved' },
    rejected:    { bg: 'bg-red-500/10',    text: 'text-red-600',    label: 'Rejected' },
    resolved:    { bg: 'bg-blue-500/10',   text: 'text-blue-600',   label: 'Resolved' },
    in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'In Progress' },
  };
  const v = map[s];
  return <Badge className={`${v.bg} ${v.text} border-transparent hover:${v.bg}`}>{v.label}</Badge>;
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

// ── Mock Data ──────────────────────────────────────────────────────────────────

// Admissions & Allocation
interface AdmissionReq {
  id: string; name: string; roll: string; dept: string; type: 'new' | 'room_change' | 'roommate_change';
  currentRoom?: string; requestedRoom?: string; reason: string; date: string; status: Status;
}
const admissions: AdmissionReq[] = [
  { id: 'A1', name: 'Anil Kumar', roll: '23R21A0501', dept: 'CSE', type: 'new', reason: 'New admission for AY 2026-27', date: '2026-04-10', status: 'pending' },
  { id: 'A2', name: 'Priya Sharma', roll: '23R21A0502', dept: 'CSE', type: 'room_change', currentRoom: 'B-204', requestedRoom: 'A-112', reason: 'Proximity to lab block', date: '2026-04-08', status: 'pending' },
  { id: 'A3', name: 'Rahul Reddy', roll: '23R21A1201', dept: 'ECE', type: 'roommate_change', currentRoom: 'C-310', reason: 'Incompatible study schedule', date: '2026-04-06', status: 'approved' },
  { id: 'A4', name: 'Sneha Patil', roll: '22R21A0401', dept: 'EEE', type: 'new', reason: 'New admission', date: '2026-04-12', status: 'pending' },
  { id: 'A5', name: 'Vikram Singh', roll: '22R21A0301', dept: 'MECH', type: 'room_change', currentRoom: 'A-105', requestedRoom: 'D-201', reason: 'Wants single-occupancy room', date: '2026-04-05', status: 'rejected' },
  { id: 'A6', name: 'Karthik Nair', roll: '23R21A6601', dept: 'IT', type: 'new', reason: 'New admission for AY 2026-27', date: '2026-04-14', status: 'pending' },
];

// Mess & Food
interface MessReq {
  id: string; name: string; roll: string; type: 'complaint' | 'diet' | 'refund';
  description: string; date: string; status: Status;
}
const messRequests: MessReq[] = [
  { id: 'M1', name: 'Ananya Das', roll: '24R21A0503', type: 'complaint', description: 'Food quality was poor at dinner on 14th April', date: '2026-04-15', status: 'pending' },
  { id: 'M2', name: 'Ravi Teja', roll: '24R21A0201', type: 'diet', description: 'Requires Jain food (no onion/garlic)', date: '2026-04-10', status: 'approved' },
  { id: 'M3', name: 'Meena Kumari', roll: '23R21A5001', type: 'refund', description: 'Was absent 12-18 April (home visit) — mess refund', date: '2026-04-12', status: 'pending' },
  { id: 'M4', name: 'Suresh Babu', roll: '21R21A0101', type: 'complaint', description: 'Insects found in lunch on 13th April', date: '2026-04-13', status: 'in_progress' },
  { id: 'M5', name: 'Divya Joshi', roll: '22R21A1202', type: 'diet', description: 'Vegan diet request', date: '2026-04-09', status: 'approved' },
  { id: 'M6', name: 'Harish Chandra', roll: '23R21A0402', type: 'refund', description: 'Medical leave 5-10 April — mess refund', date: '2026-04-11', status: 'approved' },
];

// Maintenance
interface MaintReq {
  id: string; room: string; block: string; type: 'repair' | 'electrical' | 'water' | 'furniture';
  description: string; reportedBy: string; date: string; status: Status;
}
const maintenance: MaintReq[] = [
  { id: 'MT1', room: 'B-204', block: 'B', type: 'repair', description: 'Ceiling fan not working', reportedBy: 'Priya Sharma', date: '2026-04-14', status: 'pending' },
  { id: 'MT2', room: 'C-310', block: 'C', type: 'electrical', description: 'Power socket sparking near bed', reportedBy: 'Rahul Reddy', date: '2026-04-13', status: 'in_progress' },
  { id: 'MT3', room: 'A-105', block: 'A', type: 'water', description: 'Bathroom tap leaking continuously', reportedBy: 'Vikram Singh', date: '2026-04-12', status: 'resolved' },
  { id: 'MT4', room: 'D-201', block: 'D', type: 'furniture', description: 'Needs a new study table — current one broken', reportedBy: 'Deepak Kumar', date: '2026-04-15', status: 'pending' },
  { id: 'MT5', room: 'A-112', block: 'A', type: 'water', description: 'No hot water supply since 2 days', reportedBy: 'Swathi Reddy', date: '2026-04-14', status: 'in_progress' },
  { id: 'MT6', room: 'B-108', block: 'B', type: 'electrical', description: 'Tube light flickering', reportedBy: 'Neelam Jain', date: '2026-04-11', status: 'resolved' },
];

// Discipline
interface DisciplineReq {
  id: string; name: string; roll: string; type: 'late_entry' | 'misconduct' | 'penalty';
  description: string; date: string; status: Status;
}
const discipline: DisciplineReq[] = [
  { id: 'D1', name: 'Ravi Varma', roll: '22R21A0505', type: 'late_entry', description: 'Returned at 11:45 PM (curfew 10:30 PM)', date: '2026-04-14', status: 'pending' },
  { id: 'D2', name: 'Ajay Mohan', roll: '22R21A0302', type: 'misconduct', description: 'Loud music after quiet hours — 2nd warning', date: '2026-04-13', status: 'pending' },
  { id: 'D3', name: 'Kiran Reddy', roll: '22R21A0507', type: 'penalty', description: 'Fine of Rs.500 for room damage — approval needed', date: '2026-04-12', status: 'pending' },
  { id: 'D4', name: 'Deepak Kumar', roll: '24R21A0202', type: 'late_entry', description: 'Returned at 12:30 AM — 3rd violation', date: '2026-04-10', status: 'approved' },
  { id: 'D5', name: 'Rahul Reddy', roll: '23R21A1201', type: 'misconduct', description: 'Smoking in hostel premises', date: '2026-04-08', status: 'approved' },
];

// Visitors
interface VisitorReq {
  id: string; residentName: string; roll: string; visitorName: string; relation: string;
  type: 'parent_visit' | 'guest_stay'; visitDate: string; duration: string; status: Status;
}
const visitors: VisitorReq[] = [
  { id: 'V1', residentName: 'Anil Kumar', roll: '23R21A0501', visitorName: 'Ramesh Kumar', relation: 'Father', type: 'parent_visit', visitDate: '2026-04-18', duration: 'Day visit', status: 'approved' },
  { id: 'V2', residentName: 'Sneha Patil', roll: '22R21A0401', visitorName: 'Meera Patil', relation: 'Mother', type: 'parent_visit', visitDate: '2026-04-20', duration: 'Day visit', status: 'pending' },
  { id: 'V3', residentName: 'Vikram Singh', roll: '22R21A0301', visitorName: 'Arjun Singh', relation: 'Brother', type: 'guest_stay', visitDate: '2026-04-19', duration: '2 nights', status: 'pending' },
  { id: 'V4', residentName: 'Ananya Das', roll: '24R21A0503', visitorName: 'Sunita Das', relation: 'Mother', type: 'parent_visit', visitDate: '2026-04-17', duration: 'Day visit', status: 'approved' },
  { id: 'V5', residentName: 'Suresh Babu', roll: '21R21A0101', visitorName: 'Rajesh Babu', relation: 'Uncle', type: 'guest_stay', visitDate: '2026-04-22', duration: '1 night', status: 'pending' },
];

// Leave / Outing
type LeaveType = 'night_out' | 'weekend' | 'emergency';
interface LeaveReq {
  id: string; name: string; roll: string; room: string; type: LeaveType;
  fromDate: string; toDate: string; days: number; reason: string;
  parentPhone: string; status: Status; escalation: 'warden' | 'hostel_head';
}
const leaveRequests: LeaveReq[] = [
  { id: 'L1', name: 'Anil Kumar', roll: '23R21A0501', room: 'A-101', type: 'night_out', fromDate: '2026-04-18', toDate: '2026-04-18', days: 1, reason: 'Family dinner in city', parentPhone: '9876543210', status: 'pending', escalation: 'warden' },
  { id: 'L2', name: 'Priya Sharma', roll: '23R21A0502', room: 'B-204', type: 'weekend', fromDate: '2026-04-19', toDate: '2026-04-20', days: 2, reason: 'Going home for the weekend', parentPhone: '9876543211', status: 'pending', escalation: 'warden' },
  { id: 'L3', name: 'Rahul Reddy', roll: '23R21A1201', room: 'C-310', type: 'emergency', fromDate: '2026-04-16', toDate: '2026-04-20', days: 5, reason: 'Grandmother hospitalized — need to travel home', parentPhone: '9876543212', status: 'pending', escalation: 'hostel_head' },
  { id: 'L4', name: 'Sneha Patil', roll: '22R21A0401', room: 'B-108', type: 'weekend', fromDate: '2026-04-19', toDate: '2026-04-21', days: 3, reason: 'Sister wedding preparation', parentPhone: '9876543213', status: 'pending', escalation: 'hostel_head' },
  { id: 'L5', name: 'Vikram Singh', roll: '22R21A0301', room: 'A-105', type: 'night_out', fromDate: '2026-04-17', toDate: '2026-04-17', days: 1, reason: 'Internship interview next morning', parentPhone: '9876543214', status: 'approved', escalation: 'warden' },
  { id: 'L6', name: 'Ananya Das', roll: '24R21A0503', room: 'D-102', type: 'emergency', fromDate: '2026-04-15', toDate: '2026-04-22', days: 8, reason: 'Father undergoing surgery — need to be with family', parentPhone: '9876543215', status: 'approved', escalation: 'hostel_head' },
  { id: 'L7', name: 'Karthik Nair', roll: '23R21A6601', room: 'C-215', type: 'weekend', fromDate: '2026-04-19', toDate: '2026-04-20', days: 2, reason: 'Festival at home', parentPhone: '9876543216', status: 'pending', escalation: 'warden' },
  { id: 'L8', name: 'Divya Joshi', roll: '22R21A1202', room: 'B-312', type: 'night_out', fromDate: '2026-04-20', toDate: '2026-04-20', days: 1, reason: 'Attending alumni meet in city', parentPhone: '9876543217', status: 'rejected', escalation: 'warden' },
  { id: 'L9', name: 'Meena Kumari', roll: '23R21A5001', room: 'A-207', type: 'emergency', fromDate: '2026-04-14', toDate: '2026-04-18', days: 5, reason: 'Medical checkup — specialist appointment out of city', parentPhone: '9876543219', status: 'pending', escalation: 'hostel_head' },
];

// ── Type label helpers ────────────────────────────────────────────────────────

const leaveTypeLabel: Record<string, string> = { night_out: 'Night Out', weekend: 'Weekend Leave', emergency: 'Emergency Leave' };
const admTypeLabel: Record<string, string> = { new: 'New Admission', room_change: 'Room Change', roommate_change: 'Roommate Change' };
const messTypeLabel: Record<string, string> = { complaint: 'Complaint', diet: 'Special Diet', refund: 'Refund' };
const maintTypeIcon: Record<string, React.ElementType> = { repair: Wrench, electrical: Zap, water: Droplets, furniture: Armchair };
const discTypeLabel: Record<string, string> = { late_entry: 'Late Entry', misconduct: 'Misconduct', penalty: 'Penalty' };
const visitorTypeLabel: Record<string, string> = { parent_visit: 'Parent Visit', guest_stay: 'Guest Stay' };

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  const pendingLeave = leaveRequests.filter((l) => l.status === 'pending').length;
  const pendingAdm = admissions.filter((a) => a.status === 'pending').length;
  const pendingMess = messRequests.filter((m) => m.status === 'pending').length;
  const pendingMaint = maintenance.filter((m) => m.status === 'pending' || m.status === 'in_progress').length;
  const pendingDisc = discipline.filter((d) => d.status === 'pending').length;
  const pendingVisit = visitors.filter((v) => v.status === 'pending').length;
  const totalPending = pendingLeave + pendingAdm + pendingMess + pendingMaint + pendingDisc + pendingVisit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Rooms" value="320" sub="Across 4 blocks" icon={BedDouble} />
        <StatCard title="Residents" value="580" sub="91% occupancy" icon={Users} />
        <StatCard title="Pending Actions" value={totalPending} sub="Across all categories" icon={Clock} color={totalPending > 0 ? '#f59e0b' : undefined} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--ch-text)' }}>Category Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { cat: 'Leave / Outing', total: leaveRequests.length, pending: pendingLeave },
                { cat: 'Admissions & Allocation', total: admissions.length, pending: pendingAdm },
                { cat: 'Mess & Food', total: messRequests.length, pending: pendingMess },
                { cat: 'Maintenance', total: maintenance.length, pending: pendingMaint },
                { cat: 'Discipline', total: discipline.length, pending: pendingDisc },
                { cat: 'Visitors', total: visitors.length, pending: pendingVisit },
              ].map((r) => (
                <TableRow key={r.cat} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{r.cat}</TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{r.total}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: r.pending > 0 ? '#f59e0b' : '#22c55e' }}>
                    {r.pending}
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

// ── Leave / Outing ────────────────────────────────────────────────────────────

function escalationBadge(e: 'warden' | 'hostel_head') {
  if (e === 'warden') return <Badge className="bg-blue-500/10 text-blue-600 border-transparent hover:bg-blue-500/10">Warden</Badge>;
  return <Badge className="bg-orange-500/10 text-orange-600 border-transparent hover:bg-orange-500/10">Hostel Head</Badge>;
}

function LeaveTab() {
  const [filter, setFilter] = useState('All');
  const [escFilter, setEscFilter] = useState('All');
  const [view, setView] = useState<LeaveReq | null>(null);
  const types = ['All', 'night_out', 'weekend', 'emergency'];
  const escTypes = ['All', 'warden', 'hostel_head'];

  const filtered = useMemo(() => {
    return leaveRequests.filter((l) => {
      const matchType = filter === 'All' || l.type === filter;
      const matchEsc = escFilter === 'All' || l.escalation === escFilter;
      return matchType && matchEsc;
    });
  }, [filter, escFilter]);

  const pendingCount = leaveRequests.filter((l) => l.status === 'pending').length;
  const escalatedCount = leaveRequests.filter((l) => l.escalation === 'hostel_head').length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Leave Types' : leaveTypeLabel[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={escFilter} onValueChange={setEscFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {escTypes.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Levels' : t === 'warden' ? 'Warden Level' : 'Escalated to HOD'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Night Out" value={leaveRequests.filter((l) => l.type === 'night_out').length} sub="1-day permissions" icon={MoonIcon} />
        <StatCard title="Weekend Leave" value={leaveRequests.filter((l) => l.type === 'weekend').length} sub="2-3 day leaves" icon={CalendarDays} />
        <StatCard title="Emergency" value={leaveRequests.filter((l) => l.type === 'emergency').length} sub="Urgent requests" icon={Siren} color="#ef4444" />
        <StatCard title="Escalated" value={escalatedCount} sub="Needs your approval" icon={ArrowUpRight} color="#f59e0b" />
      </div>

      {/* Escalation rules card */}
      <Card className="rounded-2xl border border-blue-500/20" style={{ backgroundColor: 'var(--ch-card)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-accent)' }}>
            <ArrowUpRight className="h-4 w-4" /> Escalation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 text-sm" style={{ color: 'var(--ch-muted)' }}>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-600 border-transparent hover:bg-blue-500/10">Warden</Badge>
              <span>&le; 2 days &mdash; auto-approved or warden handles</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500/10 text-orange-600 border-transparent hover:bg-orange-500/10">Hostel Head</Badge>
              <span>&ge; 3 days &mdash; escalated for your approval</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>
            Leave Requests ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Room</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Duration</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Escalation</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>No leave requests match the selected filters.</TableCell></TableRow>
              ) : filtered.map((l) => (
                <TableRow key={l.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{l.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{l.roll}</code></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{l.room}</TableCell>
                  <TableCell><Badge variant="outline">{leaveTypeLabel[l.type]}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>
                    {l.days === 1 ? '1 day' : `${l.days} days`}
                    <span className="block text-xs" style={{ color: 'var(--ch-muted)' }}>{l.fromDate}{l.fromDate !== l.toDate ? ` to ${l.toDate}` : ''}</span>
                  </TableCell>
                  <TableCell>{escalationBadge(l.escalation)}</TableCell>
                  <TableCell>{statusBadge(l.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(l)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Leave Request Details</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.name} &mdash; {view && leaveTypeLabel[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Name" value={view.name} />
                <DetailField label="Roll No" value={view.roll} />
                <DetailField label="Room" value={view.room} />
                <DetailField label="Leave Type" value={leaveTypeLabel[view.type]} />
                <DetailField label="From" value={view.fromDate} />
                <DetailField label="To" value={view.toDate} />
                <DetailField label="Duration" value={view.days === 1 ? '1 day' : `${view.days} days`} />
                <DetailField label="Parent Phone" value={view.parentPhone} />
                <DetailField label="Status" value={view.status} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--ch-muted)' }}>Escalation Level:</span>
                {escalationBadge(view.escalation)}
                <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  ({view.days < 3 ? 'auto — ≤ 2 days' : 'escalated — ≥ 3 days'})
                </span>
              </div>
              <div><DetailField label="Reason" value={view.reason} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Admissions & Allocation ───────────────────────────────────────────────────

function AdmissionsTab() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<AdmissionReq | null>(null);
  const types = ['All', 'new', 'room_change', 'roommate_change'];
  const filtered = useMemo(() => admissions.filter((a) => filter === 'All' || a.type === filter), [filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : admTypeLabel[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="New Admissions" value={admissions.filter((a) => a.type === 'new').length} sub="Requests" icon={BedDouble} />
        <StatCard title="Room Changes" value={admissions.filter((a) => a.type === 'room_change').length} sub="Requests" icon={TrendingUp} />
        <StatCard title="Roommate Changes" value={admissions.filter((a) => a.type === 'roommate_change').length} sub="Requests" icon={Users} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{a.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{a.roll}</code></TableCell>
                  <TableCell><Badge variant="outline">{admTypeLabel[a.type]}</Badge></TableCell>
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
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Admission Request</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.name} &mdash; {view && admTypeLabel[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Name" value={view.name} />
              <DetailField label="Roll No" value={view.roll} />
              <DetailField label="Department" value={view.dept} />
              <DetailField label="Type" value={admTypeLabel[view.type]} />
              {view.currentRoom && <DetailField label="Current Room" value={view.currentRoom} />}
              {view.requestedRoom && <DetailField label="Requested Room" value={view.requestedRoom} />}
              <DetailField label="Date" value={view.date} />
              <DetailField label="Status" value={view.status} />
              <div className="col-span-2"><DetailField label="Reason" value={view.reason} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Mess & Food ───────────────────────────────────────────────────────────────

function MessTab() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<MessReq | null>(null);
  const types = ['All', 'complaint', 'diet', 'refund'];
  const filtered = useMemo(() => messRequests.filter((m) => filter === 'All' || m.type === filter), [filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : messTypeLabel[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Complaints" value={messRequests.filter((m) => m.type === 'complaint').length} sub="Food quality issues" icon={AlertTriangle} color="#ef4444" />
        <StatCard title="Diet Requests" value={messRequests.filter((m) => m.type === 'diet').length} sub="Special diet needs" icon={UtensilsCrossed} />
        <StatCard title="Refund Requests" value={messRequests.filter((m) => m.type === 'refund').length} sub="Absence-based refunds" icon={Clock} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{m.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{m.roll}</code></TableCell>
                  <TableCell><Badge variant="outline">{messTypeLabel[m.type]}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{m.date}</TableCell>
                  <TableCell>{statusBadge(m.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(m)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
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
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Mess Request Details</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.name} &mdash; {view && messTypeLabel[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Name" value={view.name} />
              <DetailField label="Roll No" value={view.roll} />
              <DetailField label="Type" value={messTypeLabel[view.type]} />
              <DetailField label="Date" value={view.date} />
              <DetailField label="Status" value={view.status} />
              <div className="col-span-2"><DetailField label="Description" value={view.description} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Maintenance ───────────────────────────────────────────────────────────────

function MaintenanceTab() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<MaintReq | null>(null);
  const types = ['All', 'repair', 'electrical', 'water', 'furniture'];
  const typeLabels: Record<string, string> = { repair: 'Room Repair', electrical: 'Electrical', water: 'Water/Plumbing', furniture: 'Furniture' };
  const filtered = useMemo(() => maintenance.filter((m) => filter === 'All' || m.type === filter), [filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : typeLabels[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Room Repairs" value={maintenance.filter((m) => m.type === 'repair').length} sub="Issues" icon={Wrench} />
        <StatCard title="Electrical" value={maintenance.filter((m) => m.type === 'electrical').length} sub="Issues" icon={Zap} color="#f59e0b" />
        <StatCard title="Water/Plumbing" value={maintenance.filter((m) => m.type === 'water').length} sub="Issues" icon={Droplets} color="#3b82f6" />
        <StatCard title="Furniture" value={maintenance.filter((m) => m.type === 'furniture').length} sub="Requests" icon={Armchair} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Room</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Block</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Reported By</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const TypeIcon = maintTypeIcon[m.type] || Wrench;
                return (
                  <TableRow key={m.id} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{m.room}</TableCell>
                    <TableCell><Badge variant="outline">Block {m.block}</Badge></TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5" style={{ color: 'var(--ch-muted)' }} />
                        <span style={{ color: 'var(--ch-text)' }}>{typeLabels[m.type]}</span>
                      </span>
                    </TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{m.reportedBy}</TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{m.date}</TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(m)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
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
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Maintenance Request</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>Room {view?.room} &mdash; {view && typeLabels[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Room" value={view.room} />
              <DetailField label="Block" value={`Block ${view.block}`} />
              <DetailField label="Type" value={typeLabels[view.type]} />
              <DetailField label="Reported By" value={view.reportedBy} />
              <DetailField label="Date" value={view.date} />
              <DetailField label="Status" value={view.status} />
              <div className="col-span-2"><DetailField label="Description" value={view.description} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Discipline ────────────────────────────────────────────────────────────────

function DisciplineTab() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<DisciplineReq | null>(null);
  const types = ['All', 'late_entry', 'misconduct', 'penalty'];
  const filtered = useMemo(() => discipline.filter((d) => filter === 'All' || d.type === filter), [filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : discTypeLabel[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Late Entries" value={discipline.filter((d) => d.type === 'late_entry').length} sub="Violations" icon={Clock} color="#f59e0b" />
        <StatCard title="Misconduct" value={discipline.filter((d) => d.type === 'misconduct').length} sub="Complaints" icon={Ban} color="#ef4444" />
        <StatCard title="Penalties" value={discipline.filter((d) => d.type === 'penalty').length} sub="Awaiting approval" icon={ShieldAlert} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Violation</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{d.name}</TableCell>
                  <TableCell><code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{d.roll}</code></TableCell>
                  <TableCell><Badge variant="outline">{discTypeLabel[d.type]}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{d.date}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(d)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
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
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Disciplinary Record</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.name} &mdash; {view && discTypeLabel[view.type]}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Name" value={view.name} />
              <DetailField label="Roll No" value={view.roll} />
              <DetailField label="Violation Type" value={discTypeLabel[view.type]} />
              <DetailField label="Date" value={view.date} />
              <DetailField label="Status" value={view.status} />
              <div className="col-span-2"><DetailField label="Description" value={view.description} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Visitors ──────────────────────────────────────────────────────────────────

function VisitorsTab() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<VisitorReq | null>(null);
  const types = ['All', 'parent_visit', 'guest_stay'];
  const filtered = useMemo(() => visitors.filter((v) => filter === 'All' || v.type === filter), [filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : visitorTypeLabel[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Parent Visits" value={visitors.filter((v) => v.type === 'parent_visit').length} sub="Requests" icon={Users} />
        <StatCard title="Guest Stays" value={visitors.filter((v) => v.type === 'guest_stay').length} sub="Requests" icon={UserCheck} />
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Resident</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Visitor</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Relation</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Visit Date</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Duration</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{v.residentName}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{v.visitorName}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{v.relation}</TableCell>
                  <TableCell><Badge variant="outline">{visitorTypeLabel[v.type]}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{v.visitDate}</TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{v.duration}</TableCell>
                  <TableCell>{statusBadge(v.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView(v)}><Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} /></Button>
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
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Visitor Request</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>{view?.visitorName} visiting {view?.residentName}</DialogDescription>
          </DialogHeader>
          {view && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailField label="Resident" value={view.residentName} />
              <DetailField label="Roll No" value={view.roll} />
              <DetailField label="Visitor Name" value={view.visitorName} />
              <DetailField label="Relation" value={view.relation} />
              <DetailField label="Type" value={visitorTypeLabel[view.type]} />
              <DetailField label="Visit Date" value={view.visitDate} />
              <DetailField label="Duration" value={view.duration} />
              <DetailField label="Status" value={view.status} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface HostelDashboardProps {
  defaultTab?: string;
}

export default function HostelDashboard({ defaultTab = 'overview' }: HostelDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Hostel Management</h1>
        <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
          Admissions, mess, maintenance, discipline & visitor management
        </p>
      </div>

      {defaultTab === 'overview' && <OverviewTab />}
      {defaultTab === 'leave' && <LeaveTab />}
      {defaultTab === 'admissions' && <AdmissionsTab />}
      {defaultTab === 'mess' && <MessTab />}
      {defaultTab === 'maintenance' && <MaintenanceTab />}
      {defaultTab === 'discipline' && <DisciplineTab />}
      {defaultTab === 'visitors' && <VisitorsTab />}
    </div>
  );
}
