'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Clock, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Button } from '@/components/ui/button';

interface Lecture {
  id: string;
  subjectName: string;
  subjectCode: string;
  periodStart: number;
  periodEnd: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
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

export default function FacultyAcademicPlanningPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'faculty')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const days = useMemo(() => getWeekFromMonday(selectedDate), [selectedDate]);
  const selectedIso = toIsoDate(selectedDate);

  const loadPlanning = async (iso: string) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/academic-planning?facultyId=${user.id}&date=${iso}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to load classes');
        setLectures([]);
      } else {
        setLectures(data.lectures || []);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'faculty' && user.id) {
      loadPlanning(selectedIso);
    }
  }, [selectedIso, isAuthenticated, user?.role, user?.id]);

  const updateStatus = async (classId: string, status: 'Scheduled' | 'No Class') => {
    if (!user?.id) return;
    setSavingId(classId);
    try {
      const res = await fetch('/api/faculty/academic-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: user.id,
          classId,
          date: selectedIso,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || 'Failed to update');
      } else {
        toast.success(status === 'Scheduled' ? 'Marked as Scheduled' : 'Marked as No Class');
        setLectures((prev) =>
          prev.map((l) => (l.id === classId ? { ...l, status } : l))
        );
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update');
    } finally {
      setSavingId(null);
    }
  };

  const shiftWeek = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setSelectedDate(d);
  };

  return (
    <FacultyLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--ch-text)' }}>
            Academic Planning
          </h1>
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
            Update the status of your classes for each day. Students will see your updates in real time.
          </p>
        </div>

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
                  ? 'Loading classes…'
                  : `You have ${lectures.length} class${lectures.length === 1 ? '' : 'es'} scheduled`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftWeek('prev')}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
                style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
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
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

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

        {loading ? (
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <p style={{ color: 'var(--ch-muted)' }}>Loading…</p>
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
              No classes scheduled on this day
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lectures.map((lec) => (
              <FacultyLectureCard
                key={lec.id}
                lecture={lec}
                saving={savingId === lec.id}
                onUpdate={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}

function FacultyLectureCard({
  lecture,
  saving,
  onUpdate,
}: {
  lecture: Lecture;
  saving: boolean;
  onUpdate: (id: string, status: 'Scheduled' | 'No Class') => void;
}) {
  const isNoClass = lecture.status === 'No Class';
  const isScheduled = lecture.status === 'Scheduled';

  const statusColor = isScheduled ? '#059669' : isNoClass ? '#dc2626' : '#f59e0b';
  const StatusIcon = isScheduled ? CheckCircle2 : isNoClass ? XCircle : CheckCircle2;
  const statusLabel = isScheduled
    ? 'Class Scheduled'
    : isNoClass
      ? 'No Class'
      : 'Not Yet Updated';

  const cardBg = isNoClass ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.12)';
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
        {lecture.academicYear}-{lecture.semester} SEM · {lecture.department} · Class {lecture.section}
      </p>

      <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--ch-text)' }}>
        <BookOpen className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
        <span>
          Regular | {lecture.isLab ? 'Lab' : 'Theory'} | Session
          {lecture.roomNumber ? ` · Room ${lecture.roomNumber}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--ch-border)' }}>
        <Button
          size="sm"
          onClick={() => onUpdate(lecture.id, 'Scheduled')}
          disabled={saving || isScheduled}
          className="gap-1.5"
          style={{
            backgroundColor: isScheduled ? '#059669' : '#ffffff',
            color: isScheduled ? '#fff' : '#059669',
            border: '1px solid #059669',
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Class Scheduled
        </Button>
        <Button
          size="sm"
          onClick={() => onUpdate(lecture.id, 'No Class')}
          disabled={saving || isNoClass}
          className="gap-1.5"
          style={{
            backgroundColor: isNoClass ? '#dc2626' : '#ffffff',
            color: isNoClass ? '#fff' : '#dc2626',
            border: '1px solid #dc2626',
          }}
        >
          <XCircle className="w-4 h-4" />
          No Class
        </Button>
      </div>
    </div>
  );
}
