'use client';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Plus, MoreHorizontal } from 'lucide-react';
import { useFacultyDashboard } from '@/hooks/useFacultyDashboard';

const FacultyDashboard = () => {
  const { loading, stats, upcomingClasses, recentSubmissions, classPerformance, weeklyStats } = useFacultyDashboard();

  const kpiData = [
    { label: 'Total Students', value: loading ? '...' : `${stats.totalStudents}`, trend: 12, isPositive: true },
    { label: 'Avg. Class Attendance', value: loading ? '...' : `${stats.avgAttendance}%`, trend: 4.5, isPositive: true },
    { label: 'Pending Reviews', value: loading ? '...' : `${stats.pendingReviews}`, trend: 3, isPositive: false },
  ];

  const maxClasses = Math.max(...weeklyStats.map(d => d.classes), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          tabs={
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
                Dashboard
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Timetable
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
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
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
              Timetable
            </Button>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
              Attendance
            </Button>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
              Assignments
            </Button>
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
              <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
              <Button variant="link" className="text-xs text-[#141414] p-0 h-auto">
                See all
              </Button>
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
