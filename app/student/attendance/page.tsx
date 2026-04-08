'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, AlertTriangle, BookOpen, Building2,
  Pencil, FlaskConical, Music, Globe, Calculator,
  CalendarCheck, Plus,
} from 'lucide-react';
import Link from 'next/link';

// ── Circular progress SVG ─────────────────────────────────────────────────────
function CircularProgress({ value, size = 160, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  const color = value >= 75 ? '#059669' : value >= 65 ? '#d97706' : '#e05252';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f2f0ed" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── Subject icon pool ─────────────────────────────────────────────────────────
const SUBJECT_ICONS = [BookOpen, Building2, Pencil, FlaskConical, Music, Globe, Calculator];

// ── Status helpers ────────────────────────────────────────────────────────────
function getBarColor(pct: number) {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 65) return 'bg-amber-500';
  return 'bg-[#e05252]';
}
function getTextColor(pct: number) {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 65) return 'text-amber-500';
  return 'text-[#e05252]';
}
function getStatusLabel(pct: number) {
  if (pct >= 75) return 'On Track';
  if (pct >= 65) return 'Borderline';
  return 'At Risk';
}

// ── Clay Path tiers ───────────────────────────────────────────────────────────
const TIERS = [
  { label: 'Struggling', min: 0 },
  { label: 'Passing', min: 60 },
  { label: 'Good Standing', min: 75 },
  { label: 'Consistent', min: 85 },
  { label: 'Elite Scholar', min: 92 },
];
function getCurrentTier(pct: number) {
  return [...TIERS].reverse().find(t => pct >= t.min) || TIERS[0];
}
function getNextTier(pct: number) {
  return TIERS.find(t => t.min > pct);
}

export default function StudentAttendancePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loading, error, attendanceData, refetch } = useStudentAttendance();
  const router = useRouter();

  const [leaveRequests, setLeaveRequests] = useState<Array<{
    id: string; reason: string; from_date: string; to_date: string;
    status: 'pending' | 'approved' | 'rejected';
  }>>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'student') router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/student/leave-requests')
      .then(r => r.ok ? r.json() : { leaveRequests: [] })
      .then(d => setLeaveRequests(d.leaveRequests || []))
      .catch(() => {});
  }, [user?.id]);

  // ── Heatmap: last 5 weeks from recent_attendance ──────────────────────────
  const heatmapCells = useMemo(() => {
    if (!attendanceData?.recent_attendance) return [];
    // Group records by date
    const byDate: Record<string, 'present' | 'absent'> = {};
    for (const r of attendanceData.recent_attendance) {
      if (!byDate[r.date] || r.status === 'present') {
        byDate[r.date] = r.status;
      }
    }
    // Build last 35 days
    const cells: Array<'present' | 'absent' | 'none'> = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dow = d.getDay();
      if (dow === 0 || dow === 6) { cells.push('none'); continue; }
      cells.push(byDate[key] ?? 'none');
    }
    return cells;
  }, [attendanceData?.recent_attendance]);

  // ── Loading / error / no data states ──────────────────────────────────────
  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4" />
            <p className="text-[#666]">Loading attendance data...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }
  if (!isAuthenticated || user?.role !== 'student') return null;
  if (error) {
    return (
      <StudentLayout>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#e05252]/5 border border-[#e05252]/20">
          <AlertTriangle className="h-5 w-5 text-[#e05252] shrink-0" />
          <span className="text-sm text-[#1a1a1a]">{error}</span>
          <Button onClick={refetch} variant="outline" size="sm" className="ml-auto">Retry</Button>
        </div>
      </StudentLayout>
    );
  }
  if (!attendanceData) return <StudentLayout><div /></StudentLayout>;

  const { student, overall_stats, subject_wise_attendance } = attendanceData;
  const pct = overall_stats.attendance_percentage;
  // Safe-to-miss: classes you can still skip while staying ≥75%
  // = attended - 0.75 * total (if positive)
  const bufferClasses = Math.max(
    0,
    Math.floor(overall_stats.classes_attended - 0.75 * overall_stats.total_classes)
  );

  const currentTier = getCurrentTier(pct);
  const nextTier = getNextTier(pct);

  return (
    <StudentLayout>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">
          Attendance &amp; Insights
        </h1>
        <p className="text-base text-[#666]">
          Tracking your academic presence — {student.department} · {student.section}
        </p>
      </div>

      {/* ── Top Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Hero Metric */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-8 flex items-center justify-between">
          <div className="flex flex-col gap-4 max-w-sm">
            <h2 className="text-xl font-bold text-[#1a1a1a]">Term Attendance Overview</h2>
            <p className="text-sm text-[#666] leading-relaxed">
              {pct >= 75
                ? 'Your attendance is consistently high. You are well above the university requirement of 75%.'
                : `Your attendance is below the university requirement of 75%. You need to attend ${overall_stats.days_needed_for_75_percent} more consecutive classes.`}
            </p>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${pct >= 75 ? 'text-emerald-600' : 'text-[#e05252]'}`} />
              <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-600' : 'text-[#e05252]'}`}>
                {overall_stats.classes_attended} of {overall_stats.total_classes} classes attended
              </span>
            </div>
          </div>
          {/* Circular progress */}
          <div className="relative shrink-0">
            <CircularProgress value={pct} size={160} stroke={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#1a1a1a]">{pct.toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Overall</span>
            </div>
          </div>
        </div>

        {/* Buffer card */}
        <div className={`bg-white rounded-2xl border border-[#e5e5e5] border-l-4 shadow-sm pl-8 pr-6 py-8 flex flex-col justify-between ${
          bufferClasses > 0 ? 'border-l-emerald-500' : 'border-l-[#e05252]'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              bufferClasses > 0 ? 'bg-emerald-50' : 'bg-[#e05252]/10'
            }`}>
              <CalendarCheck className={`w-5 h-5 ${bufferClasses > 0 ? 'text-emerald-600' : 'text-[#e05252]'}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              bufferClasses > 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-[#e05252]/10 text-[#e05252]'
            }`}>
              {bufferClasses > 0 ? 'Safe Zone' : 'At Risk'}
            </span>
          </div>
          <div>
            <p className="text-sm text-[#666] font-semibold mb-1">Safe to Miss</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-[#1a1a1a]">{bufferClasses}</span>
              <span className="text-lg text-[#666]">Classes</span>
            </div>
            <p className="text-xs text-[#666] leading-relaxed">
              {bufferClasses > 0
                ? 'Buffer available before hitting the 75% threshold. Use wisely!'
                : `Attend ${overall_stats.days_needed_for_75_percent} more classes to reach 75%.`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* ── Left: Course-wise Breakdown ── */}
        <div className="col-span-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">Course-wise Breakdown</h2>
            <button className="text-sm font-bold text-[#e05252] hover:underline">
              View Detailed Log
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {subject_wise_attendance.map((subject, idx) => {
              const Icon = SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
              const subPct = subject.attendance_percentage;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#f2f0ed] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#666]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1a1a1a] text-base">{subject.subject_name}</p>
                        <p className="text-xs text-[#666] mt-0.5">{subject.subject_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1a1a1a]">
                        {subject.classes_attended}/{subject.total_classes}
                      </p>
                      <p className="text-[10px] font-bold text-[#666] uppercase tracking-wide">Attended</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={getTextColor(subPct)}>{subPct.toFixed(0)}% Attendance</span>
                      <span className="text-[#666]">{getStatusLabel(subPct)}</span>
                    </div>
                    <div className="h-3 bg-[#f2f0ed] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(subPct)}`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Insights ── */}
        <div className="col-span-5 flex flex-col gap-6">
          {/* Activity Heatmap */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-6">
            <h3 className="text-base font-bold text-[#1a1a1a] mb-4">Activity Heatmap</h3>
            <div className="grid grid-cols-7 gap-[6px]">
              {heatmapCells.map((cell, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-[4px] ${
                    cell === 'present' ? 'bg-emerald-500'
                    : cell === 'absent' ? 'bg-[#e05252]'
                    : 'bg-[#f2f0ed]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#f2f0ed]">
              {[
                { color: 'bg-emerald-500', label: 'Present' },
                { color: 'bg-[#e05252]', label: 'Absent' },
                { color: 'bg-[#f2f0ed]', label: 'No Class' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-[3px] ${color}`} />
                  <span className="text-xs font-bold text-[#666]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Approved Leaves */}
          <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1a1a1a]">Leave Requests</h3>
            </div>

            {leaveRequests.length === 0 ? (
              <p className="text-sm text-[#666] py-2">No leave requests found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {leaveRequests.slice(0, 3).map((req) => {
                  const borderColor =
                    req.status === 'approved' ? 'border-l-emerald-500'
                    : req.status === 'rejected' ? 'border-l-[#e05252]'
                    : 'border-l-amber-500';
                  const tagColor =
                    req.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                    : req.status === 'rejected' ? 'bg-[#e05252]/10 text-[#e05252]'
                    : 'bg-amber-50 text-amber-600';
                  return (
                    <div
                      key={req.id}
                      className={`bg-[#f9f8f6] border border-[#e5e5e5] border-l-4 ${borderColor} rounded-xl flex items-center pl-4 pr-3 py-3 gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1a1a1a] truncate">{req.reason}</p>
                        <p className="text-xs text-[#666] mt-0.5">
                          {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' – '}
                          {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor}`}>
                        {req.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Link href="/student/leave-request">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f2f0ed] hover:bg-[#e5e5e5] transition-colors text-sm font-bold text-[#1a1a1a]">
                <Plus className="w-4 h-4" />
                Request New Leave
              </button>
            </Link>
          </div>

          {/* Attendance Tier - "The Clay Path" */}
          <div className="bg-[#e05252]/5 border border-[#e05252]/15 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-[#e05252] uppercase tracking-widest mb-1">The Campus Path</p>
              <p className="text-sm font-bold text-[#1a1a1a]">Current Tier: {currentTier.label}</p>
            </div>
            {/* Progress bar */}
            <div className="relative pt-6">
              <div className="h-5 bg-[#dce0e2] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e05252] to-[#ff7572] transition-all duration-700"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {/* Tooltip */}
              <div
                className="absolute -top-1 bg-white border border-[#e05252]/20 rounded px-2 py-1 shadow text-[10px] font-bold text-[#e05252]"
                style={{ left: `calc(${Math.min(pct, 95)}% - 20px)` }}
              >
                <p>Current:</p>
                <p>{pct.toFixed(0)}%</p>
              </div>
            </div>
            <p className="text-xs text-[#666] leading-relaxed">
              {nextTier
                ? <>You are <strong>{(nextTier.min - pct).toFixed(1)}%</strong> away from reaching <strong>{nextTier.label}</strong>. Keep it up!</>
                : <>You have reached the highest tier: <strong>Elite Scholar</strong>. Outstanding!</>}
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
