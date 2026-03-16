'use client';

import { useMemo, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Plus, MoreHorizontal } from 'lucide-react';
import { useFacultyDashboard } from '@/hooks/useFacultyDashboard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const FacultyDashboard = () => {
  const { loading, stats, upcomingClasses, recentSubmissions, classPerformance, weeklyStats, leaveRequests, refetch } = useFacultyDashboard();
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [updatingLeaveId, setUpdatingLeaveId] = useState<string | null>(null);

  const filteredLeaveRequests = useMemo(() => {
    if (leaveFilter === 'all') {
      return leaveRequests;
    }
    return leaveRequests.filter((request) => request.status === leaveFilter);
  }, [leaveFilter, leaveRequests]);

  const leaveCounts = useMemo(() => {
    return {
      all: leaveRequests.length,
      approved: leaveRequests.filter((request) => request.status === 'approved').length,
      rejected: leaveRequests.filter((request) => request.status === 'rejected').length,
    };
  }, [leaveRequests]);

  const kpiData = [
    { label: 'Total Students', value: loading ? '...' : `${stats.totalStudents}`, trend: 12, isPositive: true },
    { label: 'Avg. Class Attendance', value: loading ? '...' : `${stats.avgAttendance}%`, trend: 4.5, isPositive: true },
    { label: 'Pending Reviews', value: loading ? '...' : `${stats.pendingReviews}`, trend: 3, isPositive: false },
  ];

  const maxClasses = Math.max(...weeklyStats.map(d => d.classes), 1);

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
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update leave request');
      }

      toast({ title: 'Leave updated', description: `Request ${status}.` });
      await refetch();
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({ title: 'Update failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setUpdatingLeaveId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          tabs={
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
                Dashboard
              </Button>
              <Link href="/faculty/timetable">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Timetable
                </Button>
              </Link>
              <Link href="/faculty/attendance">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Attendance
                </Button>
              </Link>
              <Link href="/faculty/grades">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Grades
                </Button>
              </Link>
              <Link href="/faculty/assignments">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Assignments
                </Button>
              </Link>
              <Link href="/faculty/announcements">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Announcements
                </Button>
              </Link>
            </div>
          }
        />
        <main className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Dashboard
            </Button>
            <Link href="/faculty/timetable">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Timetable
              </Button>
            </Link>
            <Link href="/faculty/attendance">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
            </Link>
            <Link href="/faculty/grades">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
              </Button>
            </Link>
            <Link href="/faculty/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
            <Link href="/faculty/announcements">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Announcements
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Quickly analyse your classes</h2>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {kpiData.map((kpi, idx) => (
            <Card key={idx} className="shadow-soft border-border rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.isPositive ? 'text-success' : 'text-destructive'}`}>
                    {kpi.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" className="rounded-full px-4 py-2 h-auto text-sm text-foreground hover:bg-secondary">
            All Sections
          </Button>
          <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90 text-sm">
            All Classes
          </Button>
          <Button size="icon" className="rounded-full h-9 w-9 bg-lime-400 hover:bg-lime-500 text-[#141414] ml-2">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Classes Chart */}
          <Card className="lg:col-span-2 shadow-soft border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Weekly Schedule</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-48 gap-3 mt-4">
                {weeklyStats.map((day, idx) => {
                  const height = maxClasses > 0 ? (day.classes / maxClasses) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative" style={{ height: '160px' }}>
                        {day.classes > 0 && (
                          <div className="absolute bottom-0 w-full rounded-t-lg gradient-orange transition-all" style={{ height: `${height}%` }}>
                            {day.classes === maxClasses && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground">
                                {day.classes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm">
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklyStats.reduce((sum, d) => sum + d.classes, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total classes this week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total students taught</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card className="shadow-soft border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center justify-between w-full gap-3">
                <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
                <Link href="/faculty/assignments">
                  <Button variant="link" className="text-xs text-[#141414] p-0 h-auto">
                    See all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
              ) : (
                recentSubmissions.map((submission, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 font-medium text-sm">
                      {submission.student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{submission.student}</p>
                      <p className="text-xs text-muted-foreground">{submission.assignment}</p>
                    </div>
                    <span className={`text-xs font-medium ${submission.score ? 'text-success' : 'text-warning'}`}>
                      {submission.score ? `${submission.score}%` : 'Review'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border rounded-2xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold">Leave Requests</CardTitle>
                <Badge variant="outline">{leaveCounts.all}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={leaveFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setLeaveFilter('all')}
                >
                  All ({leaveCounts.all})
                </Button>
                <Button
                  size="sm"
                  variant={leaveFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setLeaveFilter('approved')}
                >
                  Approved ({leaveCounts.approved})
                </Button>
                <Button
                  size="sm"
                  variant={leaveFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setLeaveFilter('rejected')}
                >
                  Rejected ({leaveCounts.rejected})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredLeaveRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No leave requests for this filter.</p>
              ) : (
                filteredLeaveRequests.slice(0, 6).map((request) => (
                  <div key={request.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{request.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.student_roll_no || 'No roll no'}{request.class_name ? ` • ${request.class_name}` : ''}
                        </p>
                      </div>
                      <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{request.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.from_date).toLocaleDateString()} to {new Date(request.to_date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={updatingLeaveId === request.id || request.status === 'approved'}
                        onClick={() => updateLeaveStatus(request.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingLeaveId === request.id || request.status === 'rejected'}
                        onClick={() => updateLeaveStatus(request.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Today's Classes */}
          <Card className="shadow-soft border-border rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No classes today</p>
              ) : (
                upcomingClasses.map((cls, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{cls.time}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {cls.students}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{cls.subject}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{cls.section}</span>
                      <span>{cls.room}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Class Performance */}
          <Card className="lg:col-span-2 shadow-soft border-border rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Class Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {classPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No performance data yet</p>
              ) : (
                <div className="space-y-4">
                  {classPerformance.map((item, idx) => {
                    const colors = ['bg-lime-400', 'bg-lime-300', 'bg-yellow-300'];
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{item.section}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Attendance: {item.attendance}%</span>
                            <span className="font-semibold text-foreground">Avg: {item.avgScore}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`} style={{ width: `${item.avgScore}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
