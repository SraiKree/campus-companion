'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, User, MapPin, BookOpen,
  ChevronLeft, ChevronRight, FlaskConical, GraduationCap, Timer,
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
  status: 'Scheduled' | 'No Class' | 'Not Yet Updated' | string;
  note: string | null;
}

interface DayOption {
  date: Date;
  weekdayLabel: string;
  dayNumber: number;
  iso: string;
}

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekFromMonday(anchor: Date): DayOption[] {
  const d = new Date(anchor);
  const dow = d.getDay();
  const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const out: DayOption[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    out.push({
      date,
      weekdayLabel: WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      iso: toIsoDate(date),
    });
  }
  return out;
}

function weekRangeLabel(days: DayOption[]) {
  if (!days.length) return '';
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const sameMonth = first.getMonth() === last.getMonth();
  return sameMonth
    ? `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()}–${last.getDate()}`
    : `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}`;
}

export default function StudentAcademicPlanningPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const days = useMemo(() => getWeekFromMonday(selectedDate), [selectedDate]);
  const selectedIso = toIsoDate(selectedDate);
  const todayIso = toIsoDate(new Date());

  const loadPlanning = async (iso: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError('Not signed in');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/student/academic-planning?date=${iso}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to load schedule');
        setLectures([]);
      } else {
        setLectures(data.lectures || []);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      loadPlanning(selectedIso);
    }
  }, [selectedIso, isAuthenticated, user?.role]);

  const shiftWeek = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setSelectedDate(d);
  };

  return (
    <StudentLayout>
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="border-b border-[#e5e5e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a]">Academic Planning</h1>
              <p className="text-sm text-[#666] mt-0.5">{weekRangeLabel(days)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftWeek('prev')}
                className="w-9 h-9 rounded-lg border border-[#e5e5e5] text-[#666] hover:bg-[#f2f0ed] flex items-center justify-center transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="h-9 px-4 rounded-lg border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:bg-[#f2f0ed] transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => shiftWeek('next')}
                className="w-9 h-9 rounded-lg border border-[#e5e5e5] text-[#666] hover:bg-[#f2f0ed] flex items-center justify-center transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day strip */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const isSelected = d.iso === selectedIso;
              const dayIsToday = d.iso === todayIso;
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#c44545] text-white shadow-md'
                      : 'text-[#666] hover:bg-[#f2f0ed]'
                  }`}
                >
                  <span className={`text-[10px] font-bold tracking-wider ${isSelected ? 'text-white/80' : ''}`}>
                    {d.weekdayLabel}
                  </span>
                  <span className={`text-base font-bold leading-none ${
                    isSelected ? 'text-white' : dayIsToday ? 'text-[#c44545]' : 'text-[#1a1a1a]'
                  }`}>
                    {d.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c44545]" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <XCircle className="w-12 h-12 text-[#c44545] mx-auto mb-3" />
              <p className="text-[#1a1a1a] font-medium">Couldn't load schedule</p>
              <p className="text-sm text-[#666] mt-1">{error}</p>
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-[#666] mx-auto mb-3" />
              <p className="text-[#1a1a1a] font-medium">No classes scheduled</p>
              <p className="text-sm text-[#666] mt-1">Enjoy the day off.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lectures.map((lec) => (
                <LectureCard key={lec.id} lecture={lec} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

function LectureCard({ lecture }: { lecture: Lecture }) {
  const isNoClass = lecture.status === 'No Class';
  const isScheduled = lecture.status === 'Scheduled';

  const statusMeta = isScheduled
    ? { color: '#10b981', soft: 'rgba(16,185,129,0.1)', label: 'Scheduled', Icon: CheckCircle2 }
    : isNoClass
      ? { color: '#c44545', soft: 'rgba(196,69,69,0.1)', label: 'No Class', Icon: XCircle }
      : { color: '#d97706', soft: 'rgba(217,119,6,0.1)', label: 'Pending', Icon: Clock };

  const TypeIcon = lecture.isLab ? FlaskConical : BookOpen;
  const typeLabel = lecture.isLab ? 'Lab' : 'Theory';

  return (
    <div
      className={`border border-[#e5e5e5] rounded-xl overflow-hidden flex ${
        isNoClass ? 'opacity-70' : ''
      }`}
    >
      {/* Time rail */}
      <div className="w-32 flex-shrink-0 bg-[#f2f0ed] border-r border-[#e5e5e5] p-4 flex flex-col justify-center">
        <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">
          Period {lecture.periodStart}
          {lecture.periodEnd !== lecture.periodStart && `–${lecture.periodEnd}`}
        </p>
        <p className="text-base font-bold text-[#1a1a1a] leading-tight">{lecture.startTime}</p>
        <p className="text-xs text-[#666]">to {lecture.endTime}</p>
        <div className="flex items-center gap-1 mt-2 text-[11px] text-[#666]">
          <Timer className="w-3 h-3" />
          {lecture.durationMinutes}m
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-0.5">
              {lecture.subjectCode}
            </p>
            <h3 className={`font-bold text-[#1a1a1a] leading-snug ${isNoClass ? 'line-through' : ''}`}>
              {lecture.subjectName}
            </h3>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0"
            style={{ backgroundColor: statusMeta.soft, color: statusMeta.color }}
          >
            <statusMeta.Icon className="w-3.5 h-3.5" />
            {statusMeta.label}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#666]">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {lecture.facultyName}
          </span>
          <span className="flex items-center gap-1.5">
            <TypeIcon className="w-3.5 h-3.5" />
            {typeLabel}
          </span>
          {lecture.roomNumber && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Room {lecture.roomNumber}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            {lecture.academicYear}-{lecture.semester} · Sec {lecture.section}
          </span>
        </div>

        {lecture.note && (
          <p className="mt-2.5 text-xs text-[#666] italic">
            <span className="font-bold not-italic mr-1">Note:</span>
            {lecture.note}
          </p>
        )}
      </div>
    </div>
  );
}
