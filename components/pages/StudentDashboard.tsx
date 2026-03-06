'use client';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, FileText, Clock, Plus } from 'lucide-react';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';

const StudentDashboard = () => {
  const { loading, attendanceStats, assignments, todayClasses, subjectPerformance, weeklyAttendance } = useStudentDashboard();

  const kpiData = [
    { 
      label: 'Attendance Rate', 
      value: loading ? '...' : `${attendanceStats.attendanceRate}%`, 
      trend: 3.2, 
      isPositive: true 
    },
    { 
      label: 'Total Classes', 
      value: loading ? '...' : `${attendanceStats.totalClasses}`, 
      trend: 0.8, 
      isPositive: true 
    },
    { 
      label: 'Pending Tasks', 
      value: loading ? '...' : `${assignments.filter(a => a.status === 'pending').length}`, 
      trend: 2, 
      isPositive: false 
    },
  ];

  const maxClasses = Math.max(...weeklyAttendance.map(d => d.total), 1);

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
                Attendance
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
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
              Attendance
            </Button>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
              Assignments
            </Button>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
              Grades
            </Button>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Quickly analyse your progress</h2>
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
            All
          </Button>
          <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90 text-sm">
            This Week
          </Button>
          <Button variant="ghost" className="rounded-full px-4 py-2 h-auto text-sm text-foreground hover:bg-secondary">
            This Month
          </Button>
          <Button size="icon" className="rounded-full h-9 w-9 bg-lime-400 hover:bg-lime-500 text-[#141414] ml-2">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Attendance Chart */}
          <Card className="lg:col-span-2 shadow-soft border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Weekly Attendance</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="text-lg">⋯</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-48 gap-4 mt-4">
                {weeklyAttendance.map((day, idx) => {
                  const percentage = day.total > 0 ? (day.present / day.total) * 100 : 0;
                  const height = day.total > 0 ? (day.present / maxClasses) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative" style={{ height: '160px' }}>
                        {day.total > 0 && (
                          <div className="absolute bottom-0 w-full rounded-t-lg gradient-orange transition-all" style={{ height: `${height}%` }}>
                            {percentage === 100 && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground">
                                {day.present}
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
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card className="shadow-soft border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Assignments</CardTitle>
              <Button variant="link" className="text-xs text-[#141414] p-0 h-auto">
                See all
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assignments yet</p>
              ) : (
                assignments.slice(0, 3).map((assignment, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <span className={`text-xs font-medium ${assignment.status === 'submitted' ? 'text-success' : 'text-warning'}`}>
                      {assignment.status === 'submitted' ? (assignment.marks ? `${assignment.marks}%` : '✓') : assignment.deadline}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card className="shadow-soft border-border rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No classes today</p>
              ) : (
                todayClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{cls.subject}</p>
                      <p className="text-xs text-muted-foreground">{cls.room}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{cls.time}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card className="lg:col-span-2 shadow-soft border-border rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No performance data yet</p>
              ) : (
                <div className="space-y-4">
                  {subjectPerformance.map((item, idx) => {
                    const colors = ['bg-lime-400', 'bg-lime-300', 'bg-yellow-300', 'bg-lime-500'];
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{item.subject}</span>
                          <span className="text-sm font-semibold text-foreground">{item.score}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`} style={{ width: `${item.score}%` }} />
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

export default StudentDashboard;
