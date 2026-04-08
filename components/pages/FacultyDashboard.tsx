'use client';

import { useMemo, useState } from 'react';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, CheckCircle, XCircle, Clock, BookOpen,
  FileText, Calendar, TrendingUp, ChevronRight,
  GraduationCap, ClipboardList, BarChart3, Megaphone,
} from 'lucide-react';
import { useFacultyDashboard } from '@/hooks/useFacultyDashboard';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { loading, stats, upcomingClasses, recentSubmissions, classPerformance, weeklyStats, leaveRequests, refetch } = useFacultyDashboard();
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updatingLeaveId, setUpdatingLeaveId] = useState<string | null>(null);

  const filteredLeaveRequests = useMemo(() => {
    if (leaveFilter === 'all') return leaveRequests;
    return leaveRequests.filter((r) => r.status === leaveFilter);
  }, [leaveFilter, leaveRequests]);

  const leaveCounts = useMemo(() => ({
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'pending').length,
    approved: leaveRequests.filter((r) => r.status === 'approved').length,
    rejected: leaveRequests.filter((r) => r.status === 'rejected').length,
  }), [leaveRequests]);

  const maxClasses = Math.max(...weeklyStats.map((d) => d.classes), 1);
  const totalWeeklyClasses = weeklyStats.reduce((s, d) => s + d.classes, 0);
  const todayIndex = new Date().getDay(); // 0=Sun
  const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][todayIndex];

  const facultyName = user?.name || 'Faculty';
  const facultyDept = user?.department || 'Department';

  const updateLeaveStatus = async (leaveRequestId: string, status: 'approved' | 'rejected') => {
    setUpdatingLeaveId(leaveRequestId);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch('/api/faculty/leave-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ leaveRequestId, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Failed to update leave request');
      toast({ title: 'Leave updated', description: `Request ${status}.` });
      await refetch();
    } catch (error) {
      toast({ title: 'Update failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setUpdatingLeaveId(null);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4" />
            <p className="text-[#666]">Loading your dashboard...</p>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="grid grid-cols-12 gap-5">

        {/* ── Hero Card ──────────────────────────────────────── */}
        <div className="col-span-8 bg-white rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden border border-[#e5e5e5]">
          <div>
            <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20 hover:bg-[#e05252]/10 text-[10px] font-bold tracking-wider mb-3">
              FACULTY PORTAL
            </Badge>
            <h2 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">
              {facultyName}
            </h2>
            <p className="text-base font-medium text-[#666]">{facultyDept}</p>
          </div>
          <div className="flex gap-8 pt-6 border-t border-[#e5e5e5] mt-6">
            <div>
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">Students</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{stats.totalStudents}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">Avg Attendance</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{stats.avgAttendance}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">Classes Today</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{upcomingClasses.length}</p>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#e05252]/5 rounded-full blur-3xl" />
        </div>

        {/* ── KPI Stack (right of hero) ──────────────────────── */}
        <div className="col-span-4 flex flex-col gap-5">
          <div className="flex-1 bg-white rounded-2xl p-5 border border-[#e5e5e5] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Total Students</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{stats.totalStudents}</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-5 border border-[#e5e5e5] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Pending Reviews</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{stats.pendingReviews}</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-5 border border-[#e5e5e5] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#e05252]/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#e05252]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Leave Pending</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{leaveCounts.pending}</p>
            </div>
          </div>
        </div>

        {/* ── Today's Classes ────────────────────────────────── */}
        <div className="col-span-4 bg-white rounded-2xl border border-[#e5e5e5] flex flex-col">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e05252]" />
              <h3 className="text-base font-bold text-[#1a1a1a]">Today's Classes</h3>
            </div>
            <Link href="/faculty/timetable">
              <span className="text-[10px] font-bold text-[#e05252] uppercase tracking-wider hover:underline cursor-pointer">Timetable</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5" style={{ maxHeight: '320px' }}>
            {upcomingClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-8 h-8 text-[#e5e5e5] mb-2" />
                <p className="text-sm text-[#666]">No classes today</p>
              </div>
            ) : (
              upcomingClasses.map((cls, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f9f8f6] border border-[#e5e5e5] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e05252]">{cls.time}</span>
                    <span className="text-[10px] text-[#666] flex items-center gap-1 font-medium">
                      <Users className="h-3 w-3" /> {cls.students}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{cls.subject}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#666]">
                    <span className="truncate">{cls.section}</span>
                    <span className="shrink-0 ml-2">{cls.room}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Weekly Schedule Chart ──────────────────────────── */}
        <div className="col-span-4 bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#e05252]" />
              <h3 className="text-base font-bold text-[#1a1a1a]">Weekly Load</h3>
            </div>
            <span className="text-xs font-bold text-[#666] bg-[#f2f0ed] px-2.5 py-1 rounded-full">
              {totalWeeklyClasses} classes
            </span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40 mt-2">
            {weeklyStats.map((day, idx) => {
              const height = maxClasses > 0 ? (day.classes / maxClasses) * 100 : 0;
              const isToday = day.day === todayDayName;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#666]">{day.classes || ''}</span>
                  <div className="w-full relative" style={{ height: '110px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-lg transition-all ${
                        isToday ? 'bg-[#e05252]' : day.classes > 0 ? 'bg-[#e05252]/20' : 'bg-[#f2f0ed]'
                      }`}
                      style={{ height: day.classes > 0 ? `${Math.max(height, 8)}%` : '4px' }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-[#e05252]' : 'text-[#666]'}`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent Submissions ─────────────────────────────── */}
        <div className="col-span-4 bg-white rounded-2xl border border-[#e5e5e5] flex flex-col">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#e05252]" />
              <h3 className="text-base font-bold text-[#1a1a1a]">Submissions</h3>
            </div>
            <Link href="/faculty/assignments">
              <span className="text-[10px] font-bold text-[#e05252] uppercase tracking-wider hover:underline cursor-pointer">See all</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3" style={{ maxHeight: '320px' }}>
            {recentSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-8 h-8 text-[#e5e5e5] mb-2" />
                <p className="text-sm text-[#666]">No submissions yet</p>
              </div>
            ) : (
              recentSubmissions.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#f2f0ed] flex items-center justify-center shrink-0 text-xs font-bold text-[#1a1a1a]">
                    {s.student.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{s.student}</p>
                    <p className="text-[11px] text-[#666] truncate">{s.assignment}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-bold ${s.score ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {s.score ? `${s.score}%` : 'Review'}
                    </span>
                    <p className="text-[10px] text-[#666]">{s.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Class Performance ───────────────────────────────── */}
        <div className="col-span-8 bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#e05252]" />
              <h3 className="text-base font-bold text-[#1a1a1a]">Class Performance</h3>
            </div>
            <Link href="/faculty/grades">
              <span className="text-[10px] font-bold text-[#e05252] uppercase tracking-wider hover:underline cursor-pointer">Grades</span>
            </Link>
          </div>
          {classPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <GraduationCap className="w-8 h-8 text-[#e5e5e5] mb-2" />
              <p className="text-sm text-[#666]">No performance data yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {classPerformance.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1a1a] truncate max-w-[60%]">{item.section}</span>
                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <span className="text-[#666]">
                        Attendance: <span className="font-bold text-[#1a1a1a]">{item.attendance}%</span>
                      </span>
                      <span className="text-[#666]">
                        Avg Score: <span className="font-bold text-[#e05252]">{item.avgScore}%</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 h-2.5">
                    <div className="flex-1 bg-[#f2f0ed] rounded-full overflow-hidden" title={`Attendance: ${item.attendance}%`}>
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${item.attendance}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-[#f2f0ed] rounded-full overflow-hidden" title={`Avg Score: ${item.avgScore}%`}>
                      <div
                        className="h-full bg-[#e05252] rounded-full transition-all"
                        style={{ width: `${item.avgScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[#666]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Attendance</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e05252] inline-block" /> Avg Score</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Leave Requests ──────────────────────────────────── */}
        <div className="col-span-4 bg-white rounded-2xl border border-[#e5e5e5] flex flex-col">
          <div className="p-5 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#e05252]" />
                <h3 className="text-base font-bold text-[#1a1a1a]">Leave Requests</h3>
              </div>
              {leaveCounts.pending > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                  {leaveCounts.pending} pending
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLeaveFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-colors capitalize ${
                    leaveFilter === f
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-[#f2f0ed] text-[#666] hover:bg-[#e5e5e5]'
                  }`}
                >
                  {f} ({leaveCounts[f]})
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5" style={{ maxHeight: '340px' }}>
            {filteredLeaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="w-8 h-8 text-[#e5e5e5] mb-2" />
                <p className="text-sm text-[#666]">No requests</p>
              </div>
            ) : (
              filteredLeaveRequests.map((req) => (
                <div key={req.id} className="rounded-xl bg-[#f9f8f6] border border-[#e5e5e5] p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{req.student_name}</p>
                      <p className="text-[11px] text-[#666] truncate">
                        {req.student_roll_no || '—'}{req.class_name ? ` · ${req.class_name}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : req.status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1a1a] line-clamp-2">{req.reason}</p>
                  <p className="text-[10px] text-[#666]">
                    {new Date(req.from_date).toLocaleDateString()} → {new Date(req.to_date).toLocaleDateString()}
                  </p>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        disabled={updatingLeaveId === req.id}
                        onClick={() => updateLeaveStatus(req.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={updatingLeaveId === req.id}
                        onClick={() => updateLeaveStatus(req.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Quick Navigation ────────────────────────────────── */}
        <div className="col-span-12 bg-white rounded-2xl border border-[#e5e5e5] p-5">
          <h3 className="text-base font-bold text-[#1a1a1a] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: '/faculty/attendance', label: 'Mark Attendance', icon: Calendar, color: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
              { href: '/faculty/assignments', label: 'Manage Assignments', icon: FileText, color: 'bg-amber-500/10', iconColor: 'text-amber-600' },
              { href: '/faculty/grades', label: 'Update Grades', icon: BookOpen, color: 'bg-purple-500/10', iconColor: 'text-purple-600' },
              { href: '/faculty/announcements', label: 'Post Announcement', icon: Megaphone, color: 'bg-[#e05252]/10', iconColor: 'text-[#e05252]' },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="bg-[#f9f8f6] border border-[#e5e5e5] rounded-xl p-4 flex items-center gap-4 hover:bg-[#f2f0ed] transition-colors cursor-pointer group">
                  <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shrink-0`}>
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-[#1a1a1a] flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#666] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </FacultyLayout>
  );
};

export default FacultyDashboard;
