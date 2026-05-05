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
} from 'lucide-react';

import StudentLayout from '@/components/layout/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import type { HostelStudentDetails, MessMenuRow } from '@/lib/hostel';
import { DAYS_OF_WEEK } from '@/lib/hostel';
import { MOCK_MESS_MENU } from '@/lib/hostel-mock';

type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

interface MealSlot {
  key: MealKey;
  label: string;
  icon: typeof Coffee;
  startMin: number;
  endMin: number;
  timeLabel: string;
}

const MEAL_SLOTS: MealSlot[] = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, startMin: 7 * 60 + 30, endMin: 9 * 60 + 30, timeLabel: '7:30 – 9:30 AM' },
  { key: 'lunch',     label: 'Lunch',     icon: Soup,   startMin: 12 * 60 + 30, endMin: 14 * 60 + 30, timeLabel: '12:30 – 2:30 PM' },
  { key: 'snacks',    label: 'Snacks',    icon: Cookie, startMin: 16 * 60 + 30, endMin: 17 * 60 + 30, timeLabel: '4:30 – 5:30 PM' },
  { key: 'dinner',    label: 'Dinner',    icon: Moon,   startMin: 19 * 60 + 30, endMin: 21 * 60 + 30, timeLabel: '7:30 – 9:30 PM' },
];

export default function StudentHostelPage() {
  const { user, loading: authLoading } = useAuth();

  const [details, setDetails] = useState<HostelStudentDetails | null>(null);
  const [menu, setMenu] = useState<MessMenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAllocation, setNoAllocation] = useState(false);
  const [menuView, setMenuView] = useState<'daily' | 'weekly'>('daily');
  const [now, setNow] = useState<Date>(() => new Date());

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

      // Mess menu is public info — always fetch.
      // Falls back to mock data if the API fails or returns empty rows
      // (so the daily/weekly view still works without a populated DB).
      try {
        const menuRes = await fetch('/api/hostel/mess-menu');
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          const rows: MessMenuRow[] = menuData.menu || [];
          const hasContent = rows.some(
            r => r.breakfast || r.lunch || r.snacks || r.dinner
          );
          setMenu(hasContent ? rows : (MOCK_MESS_MENU as MessMenuRow[]));
        } else {
          setMenu(MOCK_MESS_MENU as MessMenuRow[]);
        }
      } catch {
        setMenu(MOCK_MESS_MENU as MessMenuRow[]);
      }

      // Room details — only if the user has a roll number
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
    () => menu.find(r => r.day_of_week === todayName) ?? null,
    [menu, todayName]
  );

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const activeMealKey: MealKey | null =
    MEAL_SLOTS.find(s => minutesNow >= s.startMin && minutesNow <= s.endMin)?.key ?? null;
  const nextMealKey: MealKey | null = activeMealKey
    ? null
    : MEAL_SLOTS.find(s => minutesNow < s.startMin)?.key ?? null;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Compute this week's Monday → Sunday dates for the weekly view.
  const weekDates = useMemo(() => {
    const monday = new Date(now);
    const dayIdx = (now.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
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
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  }, [weekDates]);

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e05252]/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#e05252]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
              My Hostel
            </h1>
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              Your room, roommates, and weekly mess menu
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
          </div>
        )}

        {!loading && details && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <BedDouble className="w-5 h-5 text-[#e05252]" />
                  <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    Room Number
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {details.room_no}
                </p>
              </div>

              <div
                className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-[#e05252]" />
                  <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    Block
                  </h3>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {details.block}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-[#e05252]" />
                <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                  Roommates ({details.roommates.length})
                </h3>
              </div>
              {details.roommates.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                  No roommates yet — you're the only one in this room.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details.roommates.map(rm => (
                    <div
                      key={rm.roll_number}
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                        style={{ backgroundColor: 'var(--ch-accent)', color: 'var(--ch-on-accent)' }}
                      >
                        {rm.name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ch-text)' }}>
                          {rm.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                          {rm.roll_number}
                          {rm.department ? ` • ${rm.department}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state — shown if no allocation, but page still renders normally */}
        {!loading && noAllocation && !details && (
          <div
            className="flex items-start gap-3 rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <Info className="w-5 h-5 text-[#e05252] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                No hostel allocation found
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                You don't have a hostel room assigned yet. If you're a hosteller and this looks wrong,
                contact the hostel warden. The weekly mess menu is shown below.
              </p>
            </div>
          </div>
        )}

        {/* Mess menu */}
        {!loading && menu.length > 0 && (
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-[#e05252]" />
                <h3 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                  Mess Menu
                </h3>
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
                        className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 leading-none flex-shrink-0"
                        style={{ backgroundColor: 'var(--ch-accent)', color: 'var(--ch-on-accent)' }}
                      >
                        <span
                          className="w-1 h-1 rounded-full animate-blink"
                          style={{ backgroundColor: 'var(--ch-on-accent)' }}
                        />
                        Today
                      </span>
                    </div>
                    <p
                      className="text-lg font-semibold leading-tight"
                      style={{ color: 'var(--ch-text)' }}
                    >
                      {todayName}'s Menu
                    </p>
                  </div>
                  {activeMealKey && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#e05252] bg-[#e05252]/10 px-3 py-1.5 text-xs font-semibold text-[#e05252] leading-none">
                      <span className="relative inline-flex w-2 h-2 items-center justify-center">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-[#e05252] animate-blink" />
                      </span>
                      Serving now: {MEAL_SLOTS.find(s => s.key === activeMealKey)?.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MEAL_SLOTS.map(slot => {
                    const Icon = slot.icon;
                    const dish = todayRow ? todayRow[slot.key] : null;
                    const isActive = slot.key === activeMealKey;
                    const isNext = slot.key === nextMealKey;
                    return (
                      <div
                        key={slot.key}
                        className="rounded-xl p-4 transition-all"
                        style={{
                          backgroundColor: isActive ? 'var(--ch-accent-soft)' : 'var(--ch-bg)',
                          border: isActive ? '2px solid var(--ch-accent)' : '1px solid var(--ch-border)',
                          padding: isActive ? '15px' : '16px', // compensate for 2px border to keep size identical
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
                              <p
                                className="text-sm font-semibold leading-tight"
                                style={{ color: 'var(--ch-text)' }}
                              >
                                {slot.label}
                              </p>
                              <p
                                className="text-[11px] leading-tight mt-0.5"
                                style={{ color: 'var(--ch-muted)' }}
                              >
                                {slot.timeLabel}
                              </p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#e05252] flex-shrink-0 leading-none mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e05252] animate-blink" />
                              Now
                            </span>
                          )}
                          {isNext && (
                            <span
                              className="text-[10px] font-bold uppercase flex-shrink-0 leading-none mt-1"
                              style={{ color: 'var(--ch-muted)' }}
                            >
                              Up next
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-snug" style={{ color: 'var(--ch-text)' }}>
                          {dish || (
                            <span style={{ color: 'var(--ch-muted)' }}>Not set</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {menuView === 'weekly' && (
              <div className="space-y-4">
                {/* Week header strip */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p
                      className="text-[11px] uppercase tracking-wider font-medium leading-none mb-1"
                      style={{ color: 'var(--ch-muted)' }}
                    >
                      Week of
                    </p>
                    <p
                      className="text-lg font-semibold leading-tight"
                      style={{ color: 'var(--ch-text)' }}
                    >
                      {weekRangeLabel}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-4 text-[11px]"
                    style={{ color: 'var(--ch-muted)' }}
                  >
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

                {/* Planner container — desktop grid, mobile cards */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: '1px solid var(--ch-border)',
                    backgroundColor: 'var(--ch-bg)',
                    boxShadow:
                      '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    // Single source of truth for column widths — header + every row reuse this.
                    ['--planner-cols' as string]: '1.2fr 2fr 2fr 2fr 2fr',
                    ['--planner-gap' as string]: '12px',
                    ['--planner-px' as string]: '20px',
                  }}
                >
                  {/* ── Desktop grid header ─────────────────────────── */}
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
                    {MEAL_SLOTS.map(slot => {
                      const Icon = slot.icon;
                      return (
                        <div key={slot.key} className="min-w-0">
                          <div
                            className="flex items-center gap-1.5"
                            style={{ color: 'var(--ch-text)' }}
                          >
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

                  {/* ── Day rows ──────────────────────────────────── */}
                  {menu.map(row => {
                    const dayIdx = DAYS_OF_WEEK.indexOf(row.day_of_week);
                    const dayDate = weekDates[dayIdx];
                    const dayMidnight = dayDate ? dayDate.getTime() : 0;
                    const isToday = row.day_of_week === todayName;
                    const isPast = !isToday && dayMidnight < todayMidnight;

                    // Single uniform background per row — paints continuously across the entire strip.
                    const rowBg = isToday
                      ? 'var(--ch-accent-soft)'
                      : 'transparent';

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
                        {/* Desktop: grid row — same template as header so columns line up */}
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
                          {/* Day cell */}
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
                              <div
                                className="text-[11px] mt-1 leading-none truncate"
                                style={{ color: 'var(--ch-muted)' }}
                              >
                                {dayDate.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>

                          {/* Meal cells — every cell has identical box; active state is a pill INSIDE */}
                          {MEAL_SLOTS.map(slot => {
                            const dish = row[slot.key];
                            const isLiveCell =
                              isToday && slot.key === activeMealKey;
                            const isNextCell =
                              isToday &&
                              !activeMealKey &&
                              slot.key === nextMealKey;
                            return (
                              <div key={slot.key} className="min-w-0">
                                <div
                                  className="inline-flex items-start gap-1.5 rounded-lg max-w-full"
                                  style={{
                                    backgroundColor: isLiveCell
                                      ? 'var(--ch-accent)'
                                      : 'transparent',
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
                                    <p className="text-sm leading-snug break-words">
                                      {dish || (
                                        <span
                                          style={{
                                            color: isLiveCell
                                              ? 'var(--ch-on-accent)'
                                              : 'var(--ch-muted)',
                                          }}
                                        >
                                          —
                                        </span>
                                      )}
                                    </p>
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

                        {/* Mobile: stacked card */}
                        <div className="md:hidden px-4 py-4 space-y-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span
                                className="text-base font-semibold leading-none"
                                style={{ color: 'var(--ch-text)' }}
                              >
                                {row.day_of_week}
                              </span>
                              {dayDate && (
                                <span
                                  className="text-[11px] leading-none"
                                  style={{ color: 'var(--ch-muted)' }}
                                >
                                  {dayDate.toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
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
                            {MEAL_SLOTS.map(slot => {
                              const Icon = slot.icon;
                              const dish = row[slot.key];
                              const isLiveCell =
                                isToday && slot.key === activeMealKey;
                              const isNextCell =
                                isToday &&
                                !activeMealKey &&
                                slot.key === nextMealKey;
                              return (
                                <div
                                  key={slot.key}
                                  className="rounded-lg px-3 py-2.5 flex items-start gap-2.5"
                                  style={{
                                    backgroundColor: isLiveCell
                                      ? 'var(--ch-accent)'
                                      : 'var(--ch-card)',
                                    color: isLiveCell
                                      ? 'var(--ch-on-accent)'
                                      : 'var(--ch-text)',
                                    border: isLiveCell
                                      ? 'none'
                                      : '1px solid var(--ch-border)',
                                  }}
                                >
                                  <Icon
                                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                                    style={{
                                      color: isLiveCell ? 'var(--ch-on-accent)' : 'var(--ch-accent)',
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className="text-xs font-semibold leading-none"
                                        style={{
                                          color: isLiveCell
                                            ? 'var(--ch-on-accent)'
                                            : 'var(--ch-text)',
                                        }}
                                      >
                                        {slot.label}
                                      </span>
                                      <span
                                        className="text-[10px] leading-none"
                                        style={{
                                          color: isLiveCell
                                            ? 'var(--ch-on-accent)'
                                            : 'var(--ch-muted)',
                                        }}
                                      >
                                        {slot.timeLabel}
                                      </span>
                                    </div>
                                    <p
                                      className="text-sm leading-snug mt-1 break-words"
                                      style={{
                                        fontWeight: isLiveCell ? 600 : 400,
                                      }}
                                    >
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
          </div>
        )}

        {!loading && menu.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-sm"
            style={{
              backgroundColor: 'var(--ch-card)',
              borderColor: 'var(--ch-border)',
              color: 'var(--ch-muted)',
            }}
          >
            Mess menu not available yet.
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
