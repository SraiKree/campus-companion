'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, User, BookOpen, BarChart3, VideoOff, ChevronLeft, ChevronRight, XCircle, Clock,
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

  const lectureCount = lectures.filter((l) => l.status !== 'No Class').length;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: 'var(--ch-text)' }}
          >
            Academic Planning
          </h1>
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
            Day-wise view of your scheduled classes.
          </p>
        </div>

        {/* Greeting card */}
        <div
          className="rounded-2xl p-5 mb-4 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold" style={{ color: 'var(--ch-text)' }}>
                Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
                {loading
                  ? 'Loading today\'s schedule...'
                  : `Today you have ${lectureCount} Lecture${lectureCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftWeek('prev')}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
                style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-xs font-semibold px-3 h-9 rounded-full border"
                style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                Today
              </button>
              <button
                onClick={() => shiftWeek('next')}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
                style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day strip */}
          <div className="grid grid-cols-7 gap-2 mt-5">
            {days.map((d) => {
              const isSelected = d.iso === selectedIso;
              const isToday = d.iso === toIsoDate(new Date());
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.date)}
                  className="flex flex-col items-center py-2 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: isSelected ? '#2563eb' : 'var(--ch-muted)',
                  }}
                >
                  <span className="text-[11px] font-semibold tracking-wider">
                    {d.weekdayLabel}
                  </span>
                  <span
                    className="mt-1 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold"
                    style={{
                      backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? '#2563eb' : 'var(--ch-text)',
                    }}
                  >
                    {d.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lectures list */}
        {loading ? (
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <p style={{ color: 'var(--ch-muted)' }}>Loading schedule…</p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        ) : lectures.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--ch-muted)' }} />
            <p className="font-semibold" style={{ color: 'var(--ch-text)' }}>
              No classes scheduled
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
              Enjoy your day off.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lectures.map((lec) => (
              <LectureCard key={lec.id} lecture={lec} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function LectureCard({ lecture }: { lecture: Lecture }) {
  const isNoClass = lecture.status === 'No Class';
  const isScheduled = lecture.status === 'Scheduled';

  const statusColor = isScheduled ? '#059669' : isNoClass ? '#dc2626' : '#f59e0b';
  const StatusIcon = isScheduled ? CheckCircle2 : isNoClass ? XCircle : CheckCircle2;
  const statusLabel = isScheduled
    ? 'Class Scheduled'
    : isNoClass
      ? 'No Class'
      : 'Not Yet Updated';

  const cardBg = isNoClass
    ? 'rgba(239,68,68,0.08)'
    : 'rgba(251,191,36,0.12)';
  const subjectColor = isNoClass ? '#9ca3af' : '#d97706';

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: cardBg, borderColor: 'var(--ch-border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
          {lecture.startTime} to {lecture.endTime}
          <span className="mx-2" style={{ color: 'var(--ch-muted)' }}>|</span>
          <span style={{ color: 'var(--ch-muted)' }}>{lecture.durationMinutes} Min</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: statusColor }}>
          <StatusIcon className="w-4 h-4" />
          {statusLabel}
        </div>
      </div>

      <h3
        className="text-lg font-bold uppercase tracking-wide mb-1"
        style={{ color: subjectColor, textDecoration: isNoClass ? 'line-through' : 'none' }}
      >
        {lecture.subjectName}
      </h3>
      <p className="text-sm mb-3" style={{ color: 'var(--ch-text)' }}>
        {lecture.academicYear}-{lecture.semester} SEM · Class {lecture.section}
      </p>

      <div className="flex items-center gap-2 text-sm mb-1.5" style={{ color: 'var(--ch-text)' }}>
        <User className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
        <span>{lecture.facultyName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-text)' }}>
          <BookOpen className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
          <span>
            Regular | {lecture.isLab ? 'Lab' : 'Theory'} | Session
            {lecture.roomNumber ? ` · Room ${lecture.roomNumber}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: '#f59e0b' }}
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ color: 'var(--ch-muted)', opacity: 0.5 }}
          >
            <VideoOff className="w-4 h-4" />
          </div>
        </div>
      </div>

      {lecture.note && (
        <p className="mt-3 text-xs italic" style={{ color: 'var(--ch-muted)' }}>
          Note: {lecture.note}
        </p>
      )}
    </div>
  );
}
