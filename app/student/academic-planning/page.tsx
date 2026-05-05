'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Timer, RefreshCw, FileText, FlaskConical, BookOpen, XCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StudentLayout from '@/components/layout/StudentLayout';

interface Lecture {
  id: string;
  subjectName: string;
  subjectCode: string;
  periodStart: number;
  periodEnd: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  facultyName: string;
  academicYear: string;
  semester: string;
  department: string;
  section: string;
  isLab: boolean;
  roomNumber: string | null;
  status: string;
  note: string | null;
}

interface DayBucket {
  date: Date;
  iso: string;
  weekdayLabel: string;
  dayNumber: number;
  lectures: Lecture[];
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HOUR_PX = 96;
const RAIL_PX = 72;
const START_HOUR = 9;
const END_HOUR = 17;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = date.getDay();
  const diff = date.getDate() - dow + (dow === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday: Date): DayBucket[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d,
      iso: toIsoDate(d),
      weekdayLabel: WEEKDAY_LABELS[i],
      dayNumber: d.getDate(),
      lectures: [] as Lecture[],
    };
  });
}

function parseTime12h(s: string): number {
  const m = s?.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h + mins / 60;
}

function formatHourLabel(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function termLabel(d: Date) {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 7) return `Fall Semester ${y}`;
  if (m <= 4) return `Spring Semester ${y}`;
  return `Summer Semester ${y}`;
}

function semesterStart(d: Date) {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 7) return new Date(y, 7, 1);
  if (m <= 4) return new Date(y, 0, 1);
  return new Date(y, 5, 1);
}

function academicWeekNumber(d: Date) {
  const start = semesterStart(d);
  const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.floor(days / 7) + 1);
}

function dateRangeLabel(days: DayBucket[]) {
  if (!days.length) return '';
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const sameMonth = first.getMonth() === last.getMonth();
  return sameMonth
    ? `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${last.getDate()}`
    : `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}`;
}

const TONES = [
  { bg: '#E5F4EC', fg: '#1F7A56', border: '#1F7A56' },
  { bg: '#FCF1D6', fg: '#A77417', border: '#D9A23B' },
  { bg: '#EFE5FB', fg: '#6D4BB1', border: '#6D4BB1' },
  { bg: '#FCE8DA', fg: '#B8541F', border: '#D77541' },
  { bg: '#E0EBF7', fg: '#2C5C9C', border: '#3A78C8' },
  { bg: '#FBE7E8', fg: '#B8302F', border: '#C44545' },
];

function toneFor(code: string) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function buildIcs(weekDays: DayBucket[]) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Companion//Schedule//EN',
    'CALSCALE:GREGORIAN',
  ];
  const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
  for (const day of weekDays) {
    for (const lec of day.lectures) {
      const startH = parseTime12h(lec.startTime);
      const endH = parseTime12h(lec.endTime);
      if (!startH || !endH) continue;
      const dt = (h: number) => {
        const d = new Date(day.date);
        d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${y}${mo}${da}T${hh}${mi}00`;
      };
      lines.push(
        'BEGIN:VEVENT',
        `UID:${lec.id}-${day.iso}@campus-companion`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dt(startH)}`,
        `DTEND:${dt(endH)}`,
        `SUMMARY:${lec.subjectCode} ${lec.subjectName}`,
        `LOCATION:${lec.roomNumber ? `Room ${lec.roomNumber}` : 'TBA'}`,
        `DESCRIPTION:${lec.facultyName}${lec.isLab ? ' (Lab)' : ''}${lec.note ? ' — ' + lec.note : ''}`,
        'END:VEVENT'
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function StudentAcademicPlanningPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [days, setDays] = useState<DayBucket[]>(() => getWeekDays(getMondayOfWeek(new Date())));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const monday = useMemo(() => getMondayOfWeek(anchorDate), [anchorDate]);
  const week = useMemo(() => getWeekDays(monday), [monday]);

  const todayIso = toIsoDate(now);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') return;

    let cancelled = false;
    const loadWeek = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) {
          if (!cancelled) {
            setError('Not signed in');
            setLoading(false);
          }
          return;
        }
        const results = await Promise.all(
          week.map(async (d) => {
            const res = await fetch(`/api/student/academic-planning?date=${d.iso}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            const lectures: Lecture[] = res.ok ? data?.lectures || [] : [];
            return { ...d, lectures };
          })
        );
        if (!cancelled) setDays(results);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Failed to load schedule');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadWeek();
    return () => {
      cancelled = true;
    };
  }, [monday.getTime(), isAuthenticated, user?.role]);

  const shiftWeek = (dir: 'prev' | 'next') => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setAnchorDate(d);
  };

  const filteredDays = useMemo(() => {
    if (!search.trim()) return days;
    const q = search.trim().toLowerCase();
    return days.map((d) => ({
      ...d,
      lectures: d.lectures.filter(
        (l) =>
          l.subjectName.toLowerCase().includes(q) ||
          l.subjectCode.toLowerCase().includes(q) ||
          l.facultyName.toLowerCase().includes(q)
      ),
    }));
  }, [days, search]);

  const nextUp = useMemo(() => {
    const today = days.find((d) => d.iso === todayIso);
    if (!today) return null;
    const nowH = now.getHours() + now.getMinutes() / 60;
    const sorted = [...today.lectures]
      .filter((l) => l.status !== 'No Class')
      .sort((a, b) => parseTime12h(a.startTime) - parseTime12h(b.startTime));
    const ongoing = sorted.find((l) => {
      const s = parseTime12h(l.startTime);
      const e = parseTime12h(l.endTime);
      return nowH >= s && nowH < e;
    });
    if (ongoing) return { lecture: ongoing, ongoing: true, minutesAway: 0 };
    const upcoming = sorted.find((l) => parseTime12h(l.startTime) > nowH);
    if (upcoming) {
      const minutes = Math.max(1, Math.round((parseTime12h(upcoming.startTime) - nowH) * 60));
      return { lecture: upcoming, ongoing: false, minutesAway: minutes };
    }
    return null;
  }, [days, now, todayIso]);

  const stats = useMemo(() => {
    const allLectures = days.flatMap((d) => d.lectures);
    const total = allLectures.length;
    const labs = allLectures.filter((l) => l.isLab).length;
    const cancelled = allLectures.filter((l) => l.status === 'No Class').length;
    const todayBucket = days.find((d) => d.iso === todayIso);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowIso = toIsoDate(tomorrowDate);
    const tomorrowBucket = days.find((d) => d.iso === tomorrowIso);
    const totalHours = allLectures.reduce((sum, l) => sum + l.durationMinutes / 60, 0);
    return {
      total,
      labs,
      cancelled,
      totalHours,
      today: todayBucket?.lectures.length || 0,
      tomorrow: tomorrowBucket?.lectures.length || 0,
      tomorrowFirst: tomorrowBucket?.lectures[0],
    };
  }, [days, now, todayIso]);

  const handleExport = () => {
    const ics = buildIcs(days);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${days[0]?.iso || 'week'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showNowIndicator = useMemo(() => {
    if (!days.some((d) => d.iso === todayIso)) return false;
    const nowH = now.getHours() + now.getMinutes() / 60;
    return nowH >= START_HOUR && nowH <= END_HOUR;
  }, [days, now, todayIso]);

  const weekNum = academicWeekNumber(monday);

  return (
    <StudentLayout>
      <div className="space-y-5">
        {/* Eyebrow + search */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#1a1a1a]">
            WEEKLY SCHEDULE
          </span>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white border border-[#e5e5e5] rounded-full px-3.5 py-1.5 w-[280px]">
              <Search className="w-4 h-4 text-[#999]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-[#1a1a1a] placeholder:text-[#999]"
              />
            </div>
            <button
              className="w-9 h-9 rounded-full border border-[#e5e5e5] bg-white grid place-items-center text-[#666] hover:bg-[#f2f0ed] relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c44545]" />
            </button>
          </div>
        </div>

        {/* Title + next-up banner */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div>
            <h1 className="text-3xl lg:text-[38px] font-extrabold tracking-tight text-[#1a1a1a] leading-tight">
              <span className="inline-flex items-center bg-[#fbe7e8] text-[#c44545] text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full mr-3 align-middle">
                Active Term
              </span>
              Academic Week {String(weekNum).padStart(2, '0')}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#666] mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {termLabel(anchorDate)} | {dateRangeLabel(week)}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#fbe7e8] text-[#c44545] grid place-items-center flex-shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              {nextUp ? (
                <>
                  <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#c44545]">
                    {nextUp.ongoing ? 'In progress' : `Starts in ${nextUp.minutesAway}m`}
                  </div>
                  <div className="font-bold text-sm mt-0.5 text-[#1a1a1a] truncate">
                    {nextUp.lecture.subjectName}
                  </div>
                  <div className="text-xs text-[#666] truncate">
                    {nextUp.lecture.roomNumber ? `Room ${nextUp.lecture.roomNumber} · ` : ''}
                    {nextUp.lecture.facultyName}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#666]">
                    No more today
                  </div>
                  <div className="font-bold text-sm mt-0.5 text-[#1a1a1a]">All clear</div>
                  <div className="text-xs text-[#666]">No upcoming lectures.</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Calendar card */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm">
          {/* Controls */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="inline-flex p-1 bg-[#f2f0ed] rounded-full border border-[#e5e5e5]">
                <button className="bg-white shadow-sm px-4 py-1.5 text-[13px] font-semibold rounded-full text-[#1a1a1a]">
                  Weekly
                </button>
                <button
                  className="px-4 py-1.5 text-[13px] font-semibold text-[#666] rounded-full hover:text-[#1a1a1a] cursor-not-allowed"
                  title="Monthly view coming soon"
                  disabled
                >
                  Monthly
                </button>
              </div>
              <div className="flex items-center gap-2 text-[#1a1a1a]">
                <button
                  onClick={() => shiftWeek('prev')}
                  className="w-7 h-7 grid place-items-center rounded-full hover:bg-[#f2f0ed]"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm">
                  {MONTHS_LONG[monday.getMonth()]} {monday.getFullYear()}
                </span>
                <button
                  onClick={() => shiftWeek('next')}
                  className="w-7 h-7 grid place-items-center rounded-full hover:bg-[#f2f0ed]"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAnchorDate(new Date())}
                  className="ml-2 text-[12px] font-semibold text-[#666] hover:text-[#c44545] underline-offset-2 hover:underline"
                >
                  Today
                </button>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 bg-white border border-[#e5e5e5] rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[#1a1a1a] hover:bg-[#f2f0ed]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Export to Calendar (ICS)
            </button>
          </div>

          {/* Day headers */}
          <div
            className="grid border-b border-[#e5e5e5]"
            style={{ gridTemplateColumns: `${RAIL_PX}px repeat(6, 1fr)` }}
          >
            <div />
            {week.map((d) => {
              const isToday = d.iso === todayIso;
              return (
                <div key={d.iso} className="px-2.5 pt-2 pb-3 text-left">
                  <div
                    className={`text-[10px] font-bold tracking-[0.14em] uppercase ${
                      isToday ? 'text-[#c44545]' : 'text-[#999]'
                    }`}
                  >
                    {d.weekdayLabel}
                  </div>
                  <div
                    className={`text-2xl font-bold mt-1 tracking-tight ${
                      isToday ? 'text-[#c44545]' : 'text-[#1a1a1a]'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            {error && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-sm">
                <div className="text-center">
                  <XCircle className="w-10 h-10 text-[#c44545] mx-auto mb-2" />
                  <p className="text-[#1a1a1a] font-medium">Couldn't load schedule</p>
                  <p className="text-sm text-[#666] mt-1">{error}</p>
                </div>
              </div>
            )}
            {loading && !error && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#c44545]" />
              </div>
            )}

            <div
              className="relative grid"
              style={{ gridTemplateColumns: `${RAIL_PX}px repeat(6, 1fr)` }}
            >
              {HOURS.map((h) => (
                <Fragment key={h}>
                  <div
                    className="text-xs font-medium text-[#999] px-3 relative -top-1.5 tabular-nums"
                    style={{ height: HOUR_PX }}
                  >
                    {formatHourLabel(h)}
                  </div>
                  {[0, 1, 2, 3, 4, 5].map((c) => (
                    <div
                      key={c}
                      className="border-t border-l border-[#f1eee9]"
                      style={{ height: HOUR_PX }}
                    />
                  ))}
                </Fragment>
              ))}

              {/* Now indicator (only on today's column) */}
              {showNowIndicator &&
                (() => {
                  const colIdx = week.findIndex((d) => d.iso === todayIso);
                  if (colIdx === -1) return null;
                  const nowH = now.getHours() + now.getMinutes() / 60;
                  const top = (nowH - START_HOUR) * HOUR_PX;
                  return (
                    <div
                      className="absolute pointer-events-none flex items-center z-[5]"
                      style={{
                        top,
                        left: `calc(${RAIL_PX}px + ${colIdx} * (100% - ${RAIL_PX}px) / 6)`,
                        width: `calc((100% - ${RAIL_PX}px) / 6)`,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#c44545] -ml-1" />
                      <span className="flex-1 h-[1.5px] bg-[#c44545]" />
                    </div>
                  );
                })()}

              {/* Events */}
              {filteredDays.flatMap((day) => {
                const colIdx = week.findIndex((d) => d.iso === day.iso);
                if (colIdx === -1) return [];
                return day.lectures
                  .map((lec) => {
                    const start = parseTime12h(lec.startTime);
                    const end = parseTime12h(lec.endTime);
                    if (!start || !end || end <= start) return null;
                    const top = (start - START_HOUR) * HOUR_PX + 2;
                    const height = (end - start) * HOUR_PX - 4;
                    if (top < 0 || top > (END_HOUR - START_HOUR) * HOUR_PX) return null;
                    const tone = toneFor(lec.subjectCode);
                    const isLab = lec.isLab;
                    const isCancelled = lec.status === 'No Class';
                    const TypeIcon = isLab ? FlaskConical : BookOpen;
                    return (
                      <div
                        key={`${day.iso}-${lec.id}`}
                        className="absolute rounded-xl px-3.5 py-3 text-[11px] leading-snug overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
                        style={{
                          top,
                          height,
                          left: `calc(${RAIL_PX}px + ${colIdx} * (100% - ${RAIL_PX}px) / 6 + 5px)`,
                          width: `calc((100% - ${RAIL_PX}px) / 6 - 10px)`,
                          background: isLab
                            ? `repeating-linear-gradient(135deg, ${tone.bg} 0 8px, rgba(255,255,255,0.5) 8px 9px)`
                            : tone.bg,
                          color: tone.fg,
                          borderLeft: `3px ${isLab ? 'dashed' : 'solid'} ${tone.border}`,
                          opacity: isCancelled ? 0.55 : 1,
                        }}
                        title={`${lec.subjectCode} · ${lec.subjectName} · ${lec.startTime} – ${lec.endTime}${
                          lec.note ? ' — ' + lec.note : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase opacity-80">
                          <TypeIcon className="w-3 h-3" />
                          {isLab ? 'Lab Session' : lec.subjectCode}
                        </div>
                        {isLab && (
                          <div className="text-[10px] font-semibold opacity-70 mt-1">
                            {lec.subjectCode}
                          </div>
                        )}
                        <div
                          className={`font-bold text-[14px] mt-1.5 leading-snug ${
                            isCancelled ? 'line-through' : ''
                          }`}
                        >
                          {lec.subjectName}
                        </div>
                        <div className="text-[11px] opacity-85 mt-1 truncate">
                          {lec.roomNumber ? `Room ${lec.roomNumber} · ` : ''}
                          {lec.facultyName}
                        </div>
                        <div className="text-[10px] opacity-70 mt-1 font-medium tabular-nums">
                          {lec.startTime} – {lec.endTime}
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean);
              })}
            </div>
          </div>
        </div>

        {/* Bottom stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BottomCard
            icon={<FileText className="w-5 h-5" />}
            eyebrow="Today"
            title={
              stats.today === 0
                ? 'No classes today'
                : `${stats.today} ${stats.today === 1 ? 'class' : 'classes'} scheduled`
            }
            sub={
              nextUp
                ? `${nextUp.ongoing ? 'Now' : `In ${nextUp.minutesAway}m`} · ${nextUp.lecture.subjectCode}`
                : 'Enjoy the rest of your day.'
            }
          />
          <BottomCard
            icon={<BookOpen className="w-5 h-5" />}
            eyebrow="Tomorrow"
            title={
              stats.tomorrow === 0
                ? 'Free day ahead'
                : `${stats.tomorrow} ${stats.tomorrow === 1 ? 'class' : 'classes'} planned`
            }
            sub={
              stats.tomorrowFirst
                ? `Starts ${stats.tomorrowFirst.startTime} · ${stats.tomorrowFirst.subjectCode}`
                : 'Plan something productive.'
            }
          />
          <BottomCard
            icon={<FlaskConical className="w-5 h-5" />}
            eyebrow="This Week"
            title={`${stats.total} ${stats.total === 1 ? 'lecture' : 'lectures'} · ${stats.totalHours.toFixed(0)}h`}
            sub={
              stats.cancelled > 0
                ? `${stats.labs} lab ${stats.labs === 1 ? 'session' : 'sessions'} · ${stats.cancelled} cancelled`
                : `${stats.labs} lab ${stats.labs === 1 ? 'session' : 'sessions'}`
            }
          />
        </div>
      </div>
    </StudentLayout>
  );
}

function BottomCard({
  icon,
  eyebrow,
  title,
  sub,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-[18px] flex items-center gap-3.5 shadow-sm">
      <div className="w-[42px] h-[42px] rounded-xl bg-[#f2f0ed] border border-[#e5e5e5] grid place-items-center flex-shrink-0 text-[#666]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#999] text-right float-right">
          {eyebrow}
        </div>
        <div className="font-bold text-sm tracking-tight text-[#1a1a1a] truncate">{title}</div>
        <div className="text-xs text-[#666] mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}
