'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  BedDouble,
  Users,
  Utensils,
  Info,
  Coffee,
  Soup,
  Cookie,
  Moon,
  CalendarDays,
  Sun,
  FileText,
  Wallet,
  Phone,
  Download,
  Activity as ActivityIcon,
  Plus,
  CheckCircle2,
  MessageSquare,
  Wrench,
  Plane,
  MapPin,
  Hash,
  Mail,
  Star,
  ShieldAlert,
  Droplets,
  Megaphone,
  Leaf,
  Drumstick,
  ArrowRight,
  Calendar,
  LogIn,
  LogOut as LogOutIcon,
  UserCheck,
  Sparkles,
  Layers,
} from 'lucide-react';

import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { HostelStudentDetails, MessMenuRow } from '@/lib/hostel';
import { DAYS_OF_WEEK } from '@/lib/hostel';
import { MOCK_MESS_MENU } from '@/lib/hostel-mock';

// ── Types ────────────────────────────────────────────────────────────────────
type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';
type Priority = 'Low' | 'Medium' | 'High';
type LeaveStatus = 'Approved' | 'Pending' | 'Rejected';
type NoticeKind = 'announcement' | 'maintenance' | 'emergency' | 'event';
type ActivityKind = 'entry' | 'exit' | 'visitor' | 'update';

interface MealSlot {
  key: MealKey;
  label: string;
  icon: typeof Coffee;
  startMin: number;
  endMin: number;
  timeLabel: string;
}

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  priority: Priority;
  raisedAt: string;
}

interface LeaveItem {
  id: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: LeaveStatus;
  warden: string;
}

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  kind: NoticeKind;
  postedAt: string;
}

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  label: string;
  detail?: string;
  at: string;
}

// ── Static config ────────────────────────────────────────────────────────────
const MEAL_SLOTS: MealSlot[] = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, startMin: 7 * 60 + 30,  endMin: 9 * 60 + 30,  timeLabel: '7:30 – 9:30 AM' },
  { key: 'lunch',     label: 'Lunch',     icon: Soup,   startMin: 12 * 60 + 30, endMin: 14 * 60 + 30, timeLabel: '12:30 – 2:30 PM' },
  { key: 'snacks',    label: 'Snacks',    icon: Cookie, startMin: 16 * 60 + 30, endMin: 17 * 60 + 30, timeLabel: '4:30 – 5:30 PM' },
  { key: 'dinner',    label: 'Dinner',    icon: Moon,   startMin: 19 * 60 + 30, endMin: 21 * 60 + 30, timeLabel: '7:30 – 9:30 PM' },
];

const ROOM_META = {
  hostelName: 'MLR Boys Hostel',
  floor: 2,
  bedNumber: 'B',
  checkIn: '2024-08-12',
  roomType: 'Triple Sharing',
};

const FEE_INFO = {
  status: 'Paid' as const,
  amount: 45000,
  paidOn: '2026-01-15',
  semester: 'Sem 6',
};

const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'fish', 'egg', 'prawn', 'keema', 'meat'];

function dishKind(dish: string | null): 'veg' | 'nonveg' | 'none' {
  if (!dish) return 'none';
  const lc = dish.toLowerCase();
  return NON_VEG_KEYWORDS.some((k) => lc.includes(k)) ? 'nonveg' : 'veg';
}

// ── Mock content ─────────────────────────────────────────────────────────────
const MOCK_COMPLAINTS: ComplaintItem[] = [
  { id: 'c1', title: 'Water leakage in bathroom', category: 'Plumbing',   status: 'In Progress', priority: 'High',   raisedAt: '2026-05-04' },
  { id: 'c2', title: 'Tube light flickering',     category: 'Electrical', status: 'Open',        priority: 'Medium', raisedAt: '2026-05-06' },
  { id: 'c3', title: 'Slow Wi-Fi in wing',        category: 'Internet',   status: 'Resolved',    priority: 'Low',    raisedAt: '2026-04-28' },
];

const MOCK_LEAVES: LeaveItem[] = [
  { id: 'l1', reason: 'Family function',  fromDate: '2026-05-12', toDate: '2026-05-15', status: 'Approved', warden: 'Mr. Rao' },
  { id: 'l2', reason: 'Hometown visit',   fromDate: '2026-05-25', toDate: '2026-05-28', status: 'Pending',  warden: 'Mr. Rao' },
  { id: 'l3', reason: 'Medical checkup',  fromDate: '2026-04-20', toDate: '2026-04-22', status: 'Approved', warden: 'Mr. Rao' },
];

const MOCK_NOTICES: NoticeItem[] = [
  { id: 'n1', title: 'Water supply maintenance', body: 'Water unavailable from 10 AM – 1 PM tomorrow due to tank cleaning.',  kind: 'maintenance',  postedAt: '2026-05-06' },
  { id: 'n2', title: 'Hostel Day on May 20',     body: 'Cultural events from 6 PM at the lawn. Dinner will be a buffet.',     kind: 'event',        postedAt: '2026-05-05' },
  { id: 'n3', title: 'Mandatory fire drill',     body: 'Friday 4 PM. Assemble at the main lawn within 5 minutes of alarm.',   kind: 'emergency',    postedAt: '2026-05-04' },
  { id: 'n4', title: 'New mess vendor onboard',  body: 'Refreshed menu starts June 1. Feedback welcome via the rating links.', kind: 'announcement', postedAt: '2026-05-01' },
  { id: 'n5', title: 'Power shutdown 2 AM',      body: 'Backup generator scheduled servicing. Shutdown for ~30 minutes.',     kind: 'maintenance',  postedAt: '2026-04-29' },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'a1', kind: 'entry',   label: 'Returned to hostel',                                 at: 'Today, 10:42 PM' },
  { id: 'a2', kind: 'exit',    label: 'Checked out',     detail: 'Class',                   at: 'Today, 8:15 AM' },
  { id: 'a3', kind: 'visitor', label: 'Visitor approved', detail: 'Mr. Sharma (Father)',   at: 'Yesterday, 5:30 PM' },
  { id: 'a4', kind: 'update',  label: 'Complaint update', detail: 'Water leakage → In Progress', at: 'Yesterday, 11:20 AM' },
  { id: 'a5', kind: 'entry',   label: 'Returned to hostel',                                 at: 'Yesterday, 9:18 PM' },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StudentHostelPage() {
  const { user, loading: authLoading } = useAuth();

  const [details, setDetails] = useState<HostelStudentDetails | null>(null);
  const [menu, setMenu] = useState<MessMenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAllocation, setNoAllocation] = useState(false);
  const [menuView, setMenuView] = useState<'daily' | 'weekly'>('daily');
  const [now, setNow] = useState<Date>(() => new Date());

  // Local mutable copies so quick actions feel responsive.
  const [complaints, setComplaints] = useState<ComplaintItem[]>(MOCK_COMPLAINTS);
  const [leaves, setLeaves] = useState<LeaveItem[]>(MOCK_LEAVES);

  // Modals
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Form state
  const [cTitle, setCTitle] = useState('');
  const [cCategory, setCCategory] = useState('Plumbing');
  const [cPriority, setCPriority] = useState<Priority>('Medium');
  const [lReason, setLReason] = useState('');
  const [lFrom, setLFrom] = useState('');
  const [lTo, setLTo] = useState('');

  // Tick every minute so the "current meal" highlight stays accurate.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setNoAllocation(false);

      try {
        const menuRes = await fetch('/api/hostel/mess-menu');
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          const rows: MessMenuRow[] = menuData.menu || [];
          const hasContent = rows.some((r) => r.breakfast || r.lunch || r.snacks || r.dinner);
          setMenu(hasContent ? rows : (MOCK_MESS_MENU as MessMenuRow[]));
        } else {
          setMenu(MOCK_MESS_MENU as MessMenuRow[]);
        }
      } catch {
        setMenu(MOCK_MESS_MENU as MessMenuRow[]);
      }

      if (user?.roll_no) {
        try {
          const res = await fetch(`/api/hostel/student/${encodeURIComponent(user.roll_no)}`);
          if (res.ok) {
            const data = await res.json();
            setDetails(data.student);
          } else {
            setNoAllocation(true);
          }
        } catch {
          setNoAllocation(true);
        }
      } else {
        setNoAllocation(true);
      }

      setLoading(false);
    };

    load();
  }, [authLoading, user?.roll_no]);

  const todayName = DAYS_OF_WEEK[(now.getDay() + 6) % 7];
  const todayRow = useMemo(
    () => menu.find((r) => r.day_of_week === todayName) ?? null,
    [menu, todayName],
  );

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const activeMealKey: MealKey | null =
    MEAL_SLOTS.find((s) => minutesNow >= s.startMin && minutesNow <= s.endMin)?.key ?? null;
  const nextMealKey: MealKey | null = activeMealKey
    ? null
    : MEAL_SLOTS.find((s) => minutesNow < s.startMin)?.key ?? null;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const weekDates = useMemo(() => {
    const monday = new Date(now);
    const dayIdx = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - dayIdx);
    monday.setHours(0, 0, 0, 0);
    return DAYS_OF_WEEK.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [now]);

  const todayMidnight = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [now]);

  const weekRangeLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  }, [weekDates]);

  // Derived counts for overview cards
  const pendingComplaints = complaints.filter((c) => c.status !== 'Resolved').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const upcomingLeave = leaves.find((l) => l.status === 'Approved' && new Date(l.fromDate) >= new Date(todayMidnight));
  const nextMeal = activeMealKey
    ? MEAL_SLOTS.find((s) => s.key === activeMealKey)
    : nextMealKey
      ? MEAL_SLOTS.find((s) => s.key === nextMealKey)
      : MEAL_SLOTS[0];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const submitComplaint = () => {
    if (!cTitle.trim()) return;
    const fresh: ComplaintItem = {
      id: `c-${Date.now()}`,
      title: cTitle.trim(),
      category: cCategory,
      status: 'Open',
      priority: cPriority,
      raisedAt: new Date().toISOString().slice(0, 10),
    };
    setComplaints((prev) => [fresh, ...prev]);
    setCTitle('');
    setCCategory('Plumbing');
    setCPriority('Medium');
    setComplaintOpen(false);
  };

  const submitLeave = () => {
    if (!lReason.trim() || !lFrom || !lTo) return;
    const fresh: LeaveItem = {
      id: `l-${Date.now()}`,
      reason: lReason.trim(),
      fromDate: lFrom,
      toDate: lTo,
      status: 'Pending',
      warden: 'Mr. Rao',
    };
    setLeaves((prev) => [fresh, ...prev]);
    setLReason('');
    setLFrom('');
    setLTo('');
    setLeaveOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e05252]/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#e05252]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
                My Hostel
              </h1>
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                {details
                  ? `${ROOM_META.hostelName} • Block ${details.block} • Room ${details.room_no}`
                  : 'Your room, mess, complaints, and outpass — all in one place'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setComplaintOpen(true)}
              className="h-9 px-4 text-xs font-bold uppercase tracking-wider gap-2 bg-[#e05252] hover:bg-[#c44545] text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Raise Complaint
            </Button>
            <Button
              onClick={() => setLeaveOpen(true)}
              variant="outline"
              className="h-9 px-4 text-xs font-bold uppercase tracking-wider gap-2"
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <Plane className="w-3.5 h-3.5" />
              Apply Leave
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Overview cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <OverviewCard
                icon={BedDouble}
                label="Room"
                value={details?.room_no ?? '—'}
                hint={details ? `Bed ${ROOM_META.bedNumber}` : 'Not allocated'}
              />
              <OverviewCard
                icon={Layers}
                label="Block / Floor"
                value={details ? `${details.block} · F${ROOM_META.floor}` : '—'}
                hint={ROOM_META.roomType}
              />
              <OverviewCard
                icon={CheckCircle2}
                label="Status"
                value={details ? 'Active' : 'Inactive'}
                hint={details ? 'In hostel' : 'No allocation'}
                tone="success"
              />
              <OverviewCard
                icon={Wrench}
                label="Complaints"
                value={String(pendingComplaints)}
                hint="Pending"
                tone={pendingComplaints > 0 ? 'warning' : 'muted'}
              />
              <OverviewCard
                icon={Plane}
                label="Leave"
                value={pendingLeaves > 0 ? `${pendingLeaves} pending` : 'None'}
                hint={upcomingLeave ? `Next ${formatShort(upcomingLeave.fromDate)}` : 'No upcoming'}
                tone={pendingLeaves > 0 ? 'warning' : 'muted'}
              />
              <OverviewCard
                icon={Utensils}
                label="Next Meal"
                value={nextMeal?.label ?? 'Breakfast'}
                hint={nextMeal?.timeLabel ?? ''}
              />
              <OverviewCard
                icon={Wallet}
                label="Fees"
                value={FEE_INFO.status}
                hint={`${FEE_INFO.semester} · ₹${FEE_INFO.amount.toLocaleString()}`}
                tone="success"
              />
            </div>

            {/* ── Quick Actions + Notices ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Quick actions */}
              <Card className="lg:col-span-2">
                <CardHeader icon={Sparkles} title="Quick Actions" subtitle="Common things you might need" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ActionTile icon={Plus}        label="Raise Complaint"     onClick={() => setComplaintOpen(true)} />
                  <ActionTile icon={Plane}       label="Apply Leave"         onClick={() => setLeaveOpen(true)} />
                  <ActionTile icon={Phone}       label="Contact Warden"      onClick={() => setContactOpen(true)} />
                  <ActionTile icon={Download}    label="Fee Receipt"         onClick={() => alert('Downloading fee receipt…')} />
                  <ActionTile icon={FileText}    label="View Rules"          onClick={() => setRulesOpen(true)} />
                  <ActionTile icon={ShieldAlert} label="Emergency Help"      tone="danger" onClick={() => setContactOpen(true)} />
                </div>
              </Card>

              {/* Notices */}
              <Card>
                <CardHeader
                  icon={Megaphone}
                  title="Hostel Notices"
                  subtitle={`${MOCK_NOTICES.length} active`}
                  action={
                    <button
                      type="button"
                      className="text-[11px] font-bold uppercase tracking-wider hover:underline"
                      style={{ color: 'var(--ch-accent)' }}
                    >
                      View all
                    </button>
                  }
                />
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {MOCK_NOTICES.map((n) => (
                    <NoticeRow key={n.id} notice={n} />
                  ))}
                </div>
              </Card>
            </div>

            {/* ── Empty state if no allocation ───────────────────── */}
            {noAllocation && !details && (
              <div
                className="flex items-start gap-3 rounded-2xl border p-6"
                style={{
                  backgroundColor: 'var(--ch-card)',
                  borderColor: 'var(--ch-border)',
                  boxShadow: 'var(--ch-shadow-card)',
                }}
              >
                <Info className="w-5 h-5 text-[#e05252] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                    No hostel allocation found
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                    You don&apos;t have a hostel room assigned yet. If this looks wrong, contact the
                    warden. Mess menu, notices, and quick actions are still available below.
                  </p>
                </div>
              </div>
            )}

            {/* ── Room information ──────────────────────────────── */}
            {details && (
              <Card>
                <CardHeader icon={BedDouble} title="Room Information" subtitle={ROOM_META.hostelName} />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <InfoTile icon={Hash}        label="Room Number" value={details.room_no} />
                  <InfoTile icon={Building2}   label="Block"        value={details.block} />
                  <InfoTile icon={Layers}      label="Floor"        value={`Floor ${ROOM_META.floor}`} />
                  <InfoTile icon={BedDouble}   label="Bed"          value={`Bed ${ROOM_META.bedNumber}`} />
                  <InfoTile icon={MapPin}      label="Hostel"       value={ROOM_META.hostelName} />
                  <InfoTile icon={Calendar}    label="Check-in"     value={formatShort(ROOM_META.checkIn)} />
                  <InfoTile icon={Users}       label="Room Type"    value={ROOM_META.roomType} />
                  <InfoTile icon={CheckCircle2} label="Status"       value="Active" tone="success" />
                </div>
              </Card>
            )}

            {/* ── Roommates + Activity ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {details && (
                <Card className="lg:col-span-2">
                  <CardHeader
                    icon={Users}
                    title={`Roommates (${details.roommates.length})`}
                    subtitle={
                      details.roommates.length === 0
                        ? "You're the only one in this room"
                        : 'Your fellow residents'
                    }
                  />
                  {details.roommates.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed p-6 text-center text-sm"
                      style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
                    >
                      No roommates yet — your room is private.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.roommates.map((rm) => (
                        <div
                          key={rm.roll_number}
                          className="group rounded-xl border p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                          style={{
                            backgroundColor: 'var(--ch-bg)',
                            borderColor: 'var(--ch-border)',
                            boxShadow: 'var(--ch-shadow-card)',
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                            style={{
                              backgroundColor: 'var(--ch-accent)',
                              color: 'var(--ch-on-accent)',
                            }}
                          >
                            {rm.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--ch-text)' }}
                            >
                              {rm.name}
                            </p>
                            <p
                              className="text-[11px] truncate"
                              style={{ color: 'var(--ch-muted)' }}
                            >
                              {rm.roll_number}
                              {rm.department ? ` • ${rm.department}` : ''}
                              {rm.year ? ` • Y${rm.year}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full flex items-center justify-center border opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              borderColor: 'var(--ch-border)',
                              backgroundColor: 'var(--ch-card)',
                              color: 'var(--ch-accent)',
                            }}
                            title={`Contact ${rm.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Activity timeline */}
              <Card className={details ? '' : 'lg:col-span-3'}>
                <CardHeader
                  icon={ActivityIcon}
                  title="Recent Activity"
                  subtitle="Entry, exit, visitor & updates"
                />
                <ol className="relative space-y-4 pl-5">
                  <span
                    className="absolute left-[7px] top-2 bottom-2 w-px"
                    style={{ backgroundColor: 'var(--ch-border)' }}
                  />
                  {MOCK_ACTIVITY.map((a) => (
                    <ActivityRow key={a.id} item={a} />
                  ))}
                </ol>
              </Card>
            </div>

            {/* ── Mess Menu ─────────────────────────────────────── */}
            {menu.length > 0 && (
              <Card>
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--ch-accent-soft)',
                        color: 'var(--ch-accent)',
                      }}
                    >
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: 'var(--ch-text)' }}>
                        Mess Menu
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        Veg & non-veg labelled · Live serving highlighted
                      </p>
                    </div>
                  </div>

                  <div
                    className="inline-flex rounded-full border p-1 text-xs font-medium"
                    style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-bg)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setMenuView('daily')}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
                      style={{
                        backgroundColor: menuView === 'daily' ? 'var(--ch-accent)' : 'transparent',
                        color: menuView === 'daily' ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
                      }}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuView('weekly')}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
                      style={{
                        backgroundColor: menuView === 'weekly' ? 'var(--ch-accent)' : 'transparent',
                        color: menuView === 'weekly' ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
                      }}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      This Week
                    </button>
                  </div>
                </div>

                {menuView === 'daily' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-[11px] uppercase tracking-wider font-medium leading-none"
                            style={{ color: 'var(--ch-muted)' }}
                          >
                            {dateLabel}
                          </p>
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 leading-none"
                            style={{ backgroundColor: 'var(--ch-accent)', color: 'var(--ch-on-accent)' }}
                          >
                            <span
                              className="w-1 h-1 rounded-full animate-blink"
                              style={{ backgroundColor: 'var(--ch-on-accent)' }}
                            />
                            Today
                          </span>
                        </div>
                        <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--ch-text)' }}>
                          {todayName}&apos;s Menu
                        </p>
                      </div>
                      {activeMealKey && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#e05252] bg-[#e05252]/10 px-3 py-1.5 text-xs font-semibold text-[#e05252] leading-none">
                          <span className="relative inline-flex w-2 h-2 items-center justify-center">
                            <span className="absolute inline-flex w-full h-full rounded-full bg-[#e05252] animate-blink" />
                          </span>
                          Serving now: {MEAL_SLOTS.find((s) => s.key === activeMealKey)?.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MEAL_SLOTS.map((slot) => {
                        const Icon = slot.icon;
                        const dish = todayRow ? todayRow[slot.key] : null;
                        const isActive = slot.key === activeMealKey;
                        const isNext = slot.key === nextMealKey;
                        const kind = dishKind(dish);
                        return (
                          <div
                            key={slot.key}
                            className="rounded-xl p-4 transition-all hover:-translate-y-0.5"
                            style={{
                              backgroundColor: isActive ? 'var(--ch-accent-soft)' : 'var(--ch-bg)',
                              border: isActive ? '2px solid var(--ch-accent)' : '1px solid var(--ch-border)',
                              padding: isActive ? '15px' : '16px',
                              boxShadow: 'var(--ch-shadow-card)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: isActive ? 'var(--ch-accent)' : 'var(--ch-card)',
                                    color: isActive ? 'var(--ch-on-accent)' : 'var(--ch-accent)',
                                    border: isActive ? 'none' : '1px solid var(--ch-border)',
                                  }}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ch-text)' }}>
                                    {slot.label}
                                  </p>
                                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                                    {slot.timeLabel}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                                {kind !== 'none' && <VegBadge kind={kind} />}
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#e05252] leading-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#e05252] animate-blink" />
                                    Now
                                  </span>
                                )}
                                {isNext && (
                                  <span
                                    className="text-[10px] font-bold uppercase leading-none"
                                    style={{ color: 'var(--ch-muted)' }}
                                  >
                                    Up next
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm leading-snug" style={{ color: 'var(--ch-text)' }}>
                              {dish || <span style={{ color: 'var(--ch-muted)' }}>Not set</span>}
                            </p>
                            {dish && (
                              <button
                                type="button"
                                className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
                                style={{ color: 'var(--ch-accent)' }}
                                title="Rate this meal"
                              >
                                <Star className="w-3 h-3" />
                                Rate meal
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {menuView === 'weekly' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p
                          className="text-[11px] uppercase tracking-wider font-medium leading-none mb-1"
                          style={{ color: 'var(--ch-muted)' }}
                        >
                          Week of
                        </p>
                        <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--ch-text)' }}>
                          {weekRangeLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--ch-muted)' }}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#e05252] animate-blink" />
                          Now
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: 'var(--ch-accent-soft)',
                              border: '1px solid var(--ch-accent)',
                            }}
                          />
                          Today
                        </span>
                        <span className="inline-flex items-center gap-1.5 opacity-60">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--ch-border)' }}
                          />
                          Past
                        </span>
                      </div>
                    </div>

                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{
                        border: '1px solid var(--ch-border)',
                        backgroundColor: 'var(--ch-bg)',
                        boxShadow: 'var(--ch-shadow-card)',
                        ['--planner-cols' as string]: '1.2fr 2fr 2fr 2fr 2fr',
                        ['--planner-gap' as string]: '12px',
                        ['--planner-px' as string]: '20px',
                      }}
                    >
                      <div
                        className="hidden md:grid items-center text-[11px] uppercase tracking-wider font-medium"
                        style={{
                          gridTemplateColumns: 'var(--planner-cols)',
                          columnGap: 'var(--planner-gap)',
                          paddingLeft: 'var(--planner-px)',
                          paddingRight: 'var(--planner-px)',
                          paddingTop: '14px',
                          paddingBottom: '14px',
                          backgroundColor: 'var(--ch-card)',
                          borderBottom: '1px solid var(--ch-border)',
                          color: 'var(--ch-muted)',
                        }}
                      >
                        <div className="min-w-0">Day</div>
                        {MEAL_SLOTS.map((slot) => {
                          const Icon = slot.icon;
                          return (
                            <div key={slot.key} className="min-w-0">
                              <div className="flex items-center gap-1.5" style={{ color: 'var(--ch-text)' }}>
                                <Icon className="w-3.5 h-3.5 text-[#e05252] flex-shrink-0" />
                                <span className="truncate">{slot.label}</span>
                              </div>
                              <div
                                className="text-[10px] font-normal mt-0.5 normal-case tracking-normal truncate"
                                style={{ color: 'var(--ch-muted)' }}
                              >
                                {slot.timeLabel}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {menu.map((row) => {
                        const dayIdx = DAYS_OF_WEEK.indexOf(row.day_of_week);
                        const dayDate = weekDates[dayIdx];
                        const dayMidnight = dayDate ? dayDate.getTime() : 0;
                        const isToday = row.day_of_week === todayName;
                        const isPast = !isToday && dayMidnight < todayMidnight;
                        const rowBg = isToday ? 'var(--ch-accent-soft)' : 'transparent';

                        return (
                          <div
                            key={row.day_of_week}
                            className={`group transition-colors ${
                              isToday ? '' : 'hover:bg-[var(--ch-accent-softer)]'
                            }`}
                            style={{
                              borderTop: '1px solid var(--ch-border)',
                              backgroundColor: rowBg,
                            }}
                          >
                            <div
                              className="hidden md:grid items-center"
                              style={{
                                gridTemplateColumns: 'var(--planner-cols)',
                                columnGap: 'var(--planner-gap)',
                                paddingLeft: 'var(--planner-px)',
                                paddingRight: 'var(--planner-px)',
                                paddingTop: '16px',
                                paddingBottom: '16px',
                                color: isPast ? 'var(--ch-muted)' : 'var(--ch-text)',
                              }}
                            >
                              <div className="min-w-0">
                                <div
                                  className="text-sm font-semibold leading-tight flex items-center gap-2 flex-wrap"
                                  style={{ color: 'var(--ch-text)' }}
                                >
                                  <span className="truncate">{row.day_of_week}</span>
                                  {isToday && (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 leading-none flex-shrink-0"
                                      style={{ backgroundColor: 'var(--ch-accent)', color: 'var(--ch-on-accent)' }}
                                    >
                                      <span
                                        className="w-1 h-1 rounded-full animate-blink"
                                        style={{ backgroundColor: 'var(--ch-on-accent)' }}
                                      />
                                      Today
                                    </span>
                                  )}
                                </div>
                                {dayDate && (
                                  <div className="text-[11px] mt-1 leading-none truncate" style={{ color: 'var(--ch-muted)' }}>
                                    {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                )}
                              </div>

                              {MEAL_SLOTS.map((slot) => {
                                const dish = row[slot.key];
                                const isLiveCell = isToday && slot.key === activeMealKey;
                                const isNextCell = isToday && !activeMealKey && slot.key === nextMealKey;
                                const kind = dishKind(dish);
                                return (
                                  <div key={slot.key} className="min-w-0">
                                    <div
                                      className="inline-flex items-start gap-1.5 rounded-lg max-w-full"
                                      style={{
                                        backgroundColor: isLiveCell ? 'var(--ch-accent)' : 'transparent',
                                        color: isLiveCell ? 'var(--ch-on-accent)' : 'inherit',
                                        fontWeight: isLiveCell ? 600 : 400,
                                        padding: isLiveCell ? '6px 10px' : '0',
                                      }}
                                    >
                                      {isLiveCell && (
                                        <span
                                          className="w-1.5 h-1.5 rounded-full mt-[7px] animate-blink flex-shrink-0"
                                          style={{ backgroundColor: 'var(--ch-on-accent)' }}
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="text-sm leading-snug break-words">
                                            {dish || (
                                              <span
                                                style={{
                                                  color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
                                                }}
                                              >
                                                —
                                              </span>
                                            )}
                                          </p>
                                          {kind !== 'none' && !isLiveCell && <VegBadge kind={kind} compact />}
                                        </div>
                                        {isNextCell && (
                                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#e05252] mt-1 leading-none">
                                            Up next
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="md:hidden px-4 py-4 space-y-3">
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-base font-semibold leading-none" style={{ color: 'var(--ch-text)' }}>
                                    {row.day_of_week}
                                  </span>
                                  {dayDate && (
                                    <span className="text-[11px] leading-none" style={{ color: 'var(--ch-muted)' }}>
                                      {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                                {isToday && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 leading-none"
                                    style={{ backgroundColor: 'var(--ch-accent)', color: 'var(--ch-on-accent)' }}
                                  >
                                    <span
                                      className="w-1 h-1 rounded-full animate-blink"
                                      style={{ backgroundColor: 'var(--ch-on-accent)' }}
                                    />
                                    Today
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                {MEAL_SLOTS.map((slot) => {
                                  const Icon = slot.icon;
                                  const dish = row[slot.key];
                                  const isLiveCell = isToday && slot.key === activeMealKey;
                                  const isNextCell = isToday && !activeMealKey && slot.key === nextMealKey;
                                  const kind = dishKind(dish);
                                  return (
                                    <div
                                      key={slot.key}
                                      className="rounded-lg px-3 py-2.5 flex items-start gap-2.5"
                                      style={{
                                        backgroundColor: isLiveCell ? 'var(--ch-accent)' : 'var(--ch-card)',
                                        color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-text)',
                                        border: isLiveCell ? 'none' : '1px solid var(--ch-border)',
                                      }}
                                    >
                                      <Icon
                                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                                        style={{ color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-accent)' }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span
                                            className="text-xs font-semibold leading-none"
                                            style={{ color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-text)' }}
                                          >
                                            {slot.label}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            {kind !== 'none' && <VegBadge kind={kind} compact onLight={isLiveCell} />}
                                            <span
                                              className="text-[10px] leading-none"
                                              style={{ color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-muted)' }}
                                            >
                                              {slot.timeLabel}
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-sm leading-snug mt-1 break-words" style={{ fontWeight: isLiveCell ? 600 : 400 }}>
                                          {isLiveCell && (
                                            <span
                                              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle animate-blink"
                                              style={{ backgroundColor: 'var(--ch-on-accent)' }}
                                            />
                                          )}
                                          {dish || '—'}
                                        </p>
                                        {isNextCell && (
                                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#e05252] mt-1 leading-none">
                                            Up next
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* ── Complaints + Leave ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Complaints */}
              <Card>
                <CardHeader
                  icon={Wrench}
                  title="Complaints & Maintenance"
                  subtitle={`${pendingComplaints} pending · ${complaints.length} total`}
                  action={
                    <Button
                      onClick={() => setComplaintOpen(true)}
                      size="sm"
                      className="h-8 gap-1.5 text-xs bg-[#e05252] hover:bg-[#c44545] text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Raise
                    </Button>
                  }
                />
                <div className="space-y-2">
                  {complaints.length === 0 ? (
                    <EmptyHint label="No complaints raised yet." />
                  ) : (
                    complaints.map((c) => <ComplaintRow key={c.id} item={c} />)
                  )}
                </div>
              </Card>

              {/* Leave */}
              <Card>
                <CardHeader
                  icon={Plane}
                  title="Leave / Outpass"
                  subtitle={`${pendingLeaves} pending · ${leaves.length} total`}
                  action={
                    <Button
                      onClick={() => setLeaveOpen(true)}
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Apply
                    </Button>
                  }
                />
                <div className="space-y-2">
                  {leaves.length === 0 ? (
                    <EmptyHint label="No leave history yet." />
                  ) : (
                    leaves.map((l) => <LeaveRow key={l.id} item={l} />)
                  )}
                </div>
              </Card>
            </div>

            {!loading && menu.length === 0 && (
              <div
                className="rounded-2xl border p-6 text-sm"
                style={{
                  backgroundColor: 'var(--ch-card)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-muted)',
                  boxShadow: 'var(--ch-shadow-card)',
                }}
              >
                Mess menu not available yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--ch-elevated)',
            borderColor: 'var(--ch-border)',
            boxShadow: 'var(--ch-shadow-elevated)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Raise a Complaint</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>
              Tell the warden what&apos;s wrong. We&apos;ll route it to the right team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                Title
              </label>
              <Input
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="e.g., AC not cooling"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  Category
                </label>
                <select
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
                  style={{
                    backgroundColor: 'var(--ch-input)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Internet</option>
                  <option>Cleanliness</option>
                  <option>Furniture</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  Priority
                </label>
                <select
                  value={cPriority}
                  onChange={(e) => setCPriority(e.target.value as Priority)}
                  className="mt-1 h-10 w-full rounded-md border px-3 text-sm"
                  style={{
                    backgroundColor: 'var(--ch-input)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setComplaintOpen(false)}
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              Cancel
            </Button>
            <Button onClick={submitComplaint} className="bg-[#e05252] hover:bg-[#c44545] text-white">
              Submit complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--ch-elevated)',
            borderColor: 'var(--ch-border)',
            boxShadow: 'var(--ch-shadow-elevated)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Apply for Leave / Outpass</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>
              Submit dates and reason. Warden will review and approve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                Reason
              </label>
              <Textarea
                value={lReason}
                onChange={(e) => setLReason(e.target.value)}
                placeholder="Briefly describe your reason for leave"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  From
                </label>
                <Input
                  type="date"
                  value={lFrom}
                  onChange={(e) => setLFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
                  To
                </label>
                <Input
                  type="date"
                  value={lTo}
                  onChange={(e) => setLTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setLeaveOpen(false)}
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              Cancel
            </Button>
            <Button onClick={submitLeave} className="bg-[#e05252] hover:bg-[#c44545] text-white">
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--ch-elevated)',
            borderColor: 'var(--ch-border)',
            boxShadow: 'var(--ch-shadow-elevated)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Hostel Rules</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>
              Quick summary — full handbook on the notice board.
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm space-y-2 mt-2 list-disc pl-5" style={{ color: 'var(--ch-text)' }}>
            <li>Curfew: residents must return by 9:30 PM on weekdays.</li>
            <li>Visitors are allowed only between 4 – 7 PM in the visitor lounge.</li>
            <li>Mess timings are non-negotiable; arrive 15 minutes before close.</li>
            <li>No cooking, smoking, or alcohol in rooms — strictly enforced.</li>
            <li>Outpass required for overnight stays away. Apply 24 hrs in advance.</li>
            <li>Report damages within 48 hours to avoid hold-back of caution deposit.</li>
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--ch-elevated)',
            borderColor: 'var(--ch-border)',
            boxShadow: 'var(--ch-shadow-elevated)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ch-text)' }}>Contact Warden / Emergency</DialogTitle>
            <DialogDescription style={{ color: 'var(--ch-muted)' }}>
              Reach the right person quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <ContactRow icon={Phone} label="Warden — Mr. Rao"      value="+91 98765 43210" />
            <ContactRow icon={Phone} label="Asst. Warden"           value="+91 98765 43211" />
            <ContactRow icon={ShieldAlert} label="Emergency / Security" value="+91 98765 90000" />
            <ContactRow icon={Mail}  label="Hostel Office"           value="hostel@mlrit.ac.in" />
          </div>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}

// ── Helpers / sub-components ────────────────────────────────────────────────

function formatShort(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--ch-card)',
        borderColor: 'var(--ch-border)',
        boxShadow: 'var(--ch-shadow-card)',
      }}
    >
      {children}
    </section>
  );
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof Coffee;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'var(--ch-accent-soft)',
            color: 'var(--ch-accent)',
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--ch-text)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ch-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: typeof Coffee;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const toneColor =
    tone === 'success' ? '#10b981' : tone === 'warning' ? '#f59e0b' : 'var(--ch-accent)';
  return (
    <div
      className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--ch-card)',
        borderColor: 'var(--ch-border)',
        boxShadow: 'var(--ch-shadow-card)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[10px] font-bold uppercase tracking-wider truncate"
          style={{ color: 'var(--ch-muted)' }}
        >
          {label}
        </p>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: toneColor }} />
      </div>
      <p
        className="text-lg font-bold leading-tight truncate"
        style={{ color: tone === 'muted' ? 'var(--ch-muted)' : 'var(--ch-text)' }}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--ch-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Coffee;
  label: string;
  value: string;
  tone?: 'default' | 'success';
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: tone === 'success' ? '#10b981' : 'var(--ch-accent)' }}
        />
        <p
          className="text-[10px] font-bold uppercase tracking-wider truncate"
          style={{ color: 'var(--ch-muted)' }}
        >
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ch-text)' }}>
        {value}
      </p>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: typeof Coffee;
  label: string;
  onClick?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 group"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
        boxShadow: 'var(--ch-shadow-card)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor:
              tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'var(--ch-accent-soft)',
            color: tone === 'danger' ? '#ef4444' : 'var(--ch-accent)',
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <ArrowRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
          style={{ color: 'var(--ch-muted)' }}
        />
      </div>
      <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ch-text)' }}>
        {label}
      </p>
    </button>
  );
}

function NoticeRow({ notice }: { notice: NoticeItem }) {
  const meta = noticeMeta(notice.kind);
  return (
    <div
      className="rounded-xl border p-3 flex items-start gap-3"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        <meta.icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ch-text)' }}>
            {notice.title}
          </p>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <p className="text-xs leading-snug line-clamp-2" style={{ color: 'var(--ch-muted)' }}>
          {notice.body}
        </p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--ch-muted)' }}>
          {formatShort(notice.postedAt)}
        </p>
      </div>
    </div>
  );
}

function noticeMeta(kind: NoticeKind) {
  switch (kind) {
    case 'emergency':
      return { icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239,68,68,0.14)', label: 'Urgent' };
    case 'maintenance':
      return { icon: Droplets, color: '#3b82f6', bg: 'rgba(59,130,246,0.14)', label: 'Maintenance' };
    case 'event':
      return { icon: Sparkles, color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)', label: 'Event' };
    case 'announcement':
    default:
      return { icon: Megaphone, color: '#10b981', bg: 'rgba(16,185,129,0.14)', label: 'Notice' };
  }
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = activityMeta(item.kind);
  return (
    <li className="relative">
      <span
        className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2"
        style={{
          backgroundColor: meta.bg,
          borderColor: 'var(--ch-card)',
          color: meta.color,
        }}
      />
      <div className="flex items-start gap-2">
        <meta.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: 'var(--ch-text)' }}>
            {item.label}
            {item.detail && (
              <span className="font-normal" style={{ color: 'var(--ch-muted)' }}>
                {' '}
                · {item.detail}
              </span>
            )}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            {item.at}
          </p>
        </div>
      </div>
    </li>
  );
}

function activityMeta(kind: ActivityKind) {
  switch (kind) {
    case 'entry':
      return { icon: LogIn, color: '#10b981', bg: 'rgba(16,185,129,0.14)' };
    case 'exit':
      return { icon: LogOutIcon, color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' };
    case 'visitor':
      return { icon: UserCheck, color: '#3b82f6', bg: 'rgba(59,130,246,0.14)' };
    case 'update':
    default:
      return { icon: MessageSquare, color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)' };
  }
}

function ComplaintRow({ item }: { item: ComplaintItem }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--ch-text)' }}>
            {item.title}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            {item.category} · {formatShort(item.raisedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PriorityBadge priority={item.priority} />
          <StatusPill status={item.status} />
        </div>
      </div>
      <ComplaintTracker status={item.status} />
    </div>
  );
}

function ComplaintTracker({ status }: { status: ComplaintStatus }) {
  const stages: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved'];
  const reachedIdx = stages.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1 flex-1">
          <div
            className="h-1.5 rounded-full flex-1 transition-colors"
            style={{
              backgroundColor: i <= reachedIdx ? 'var(--ch-accent)' : 'var(--ch-border)',
            }}
          />
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{
              color: i <= reachedIdx ? 'var(--ch-accent)' : 'var(--ch-muted)',
            }}
          >
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeaveRow({ item }: { item: LeaveItem }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--ch-text)' }}>
            {item.reason}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            {formatShort(item.fromDate)} → {formatShort(item.toDate)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--ch-muted)' }}>
            Warden: {item.warden}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ComplaintStatus | LeaveStatus }) {
  const map: Record<string, { color: string; bg: string }> = {
    Open:          { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
    'In Progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.14)' },
    Resolved:      { color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
    Approved:      { color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
    Pending:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
    Rejected:      { color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { color: string; bg: string }> = {
    Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
    High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  };
  const s = map[priority];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {priority}
    </span>
  );
}

function VegBadge({
  kind,
  compact,
  onLight,
}: {
  kind: 'veg' | 'nonveg';
  compact?: boolean;
  onLight?: boolean;
}) {
  const isVeg = kind === 'veg';
  const color = isVeg ? '#16a34a' : '#dc2626';
  const Icon = isVeg ? Leaf : Drumstick;
  if (onLight) {
    return (
      <span
        className="inline-flex items-center justify-center rounded"
        style={{
          width: compact ? '14px' : '16px',
          height: compact ? '14px' : '16px',
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
        title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      >
        <Icon className="w-2.5 h-2.5 text-white" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5"
      style={{
        backgroundColor: isVeg ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
        color,
        border: `1px solid ${color}`,
      }}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <Icon className="w-2.5 h-2.5" />
      {!compact && (
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {isVeg ? 'Veg' : 'Non-veg'}
        </span>
      )}
    </span>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coffee;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl border p-3 flex items-center gap-3"
      style={{
        backgroundColor: 'var(--ch-bg)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: 'var(--ch-accent-soft)',
          color: 'var(--ch-accent)',
        }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--ch-text)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border border-dashed p-4 text-center text-xs"
      style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
    >
      {label}
    </div>
  );
}
