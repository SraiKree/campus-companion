'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, BookOpen, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentAttendancePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loading, error, attendanceData, refetch, getAttendanceStatus } = useStudentAttendance();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading attendance data...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          tabs={
            <div className="flex items-center gap-2">
              <Link href="/student">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
                Attendance
              </Button>
              <Link href="/student/assignments">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Assignments
                </Button>
              </Link>
              <Link href="/student/grades">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Grades
                </Button>
              </Link>
              <Link href="/student/leave-request">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Leave Request
                </Button>
              </Link>
            </div>
          }
        />
        <main className="p-6 max-w-7xl mx-auto">
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          tabs={
            <div className="flex items-center gap-2">
              <Link href="/student">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
                Attendance
              </Button>
              <Link href="/student/assignments">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Assignments
                </Button>
              </Link>
              <Link href="/student/grades">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Grades
                </Button>
              </Link>
              <Link href="/student/leave-request">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Leave Request
                </Button>
              </Link>
            </div>
          }
        />
        <main className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Attendance Data</h2>
            <p className="text-muted-foreground">No attendance records found for your account.</p>
          </div>
        </main>
      </div>
    );
  }

  const { student, overall_stats, subject_wise_attendance } = attendanceData;
  const overallStatus = getAttendanceStatus(overall_stats.attendance_percentage);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Attendance
            </Button>
            <Link href="/student/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
            <Link href="/student/grades">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
              </Button>
            </Link>
            <Link href="/student/leave-request">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Leave Request
              </Button>
            </Link>
          </div>
        }
      />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Student Info Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance Overview</h1>
            <p className="text-muted-foreground">
              {student.name} • {student.roll_number} • {student.department} - {student.section}
            </p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            Refresh Data
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {overall_stats.attendance_percentage.toFixed(1)}%
              </div>
              <Progress value={overall_stats.attendance_percentage} className="mb-2" />
              <Badge variant={overall_stats.attendance_percentage >= 75 ? "default" : "destructive"}>
                {overall_stats.attendance_percentage >= 75 ? "Good Standing" : "Below Requirement"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overall_stats.classes_attended}
              </div>
              <p className="text-xs text-muted-foreground">
                out of {overall_stats.total_classes} total classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Missed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overall_stats.total_classes - overall_stats.classes_attended}
              </div>
              <p className="text-xs text-muted-foreground">
                classes missed this semester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days to 75%</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overall_stats.days_needed_for_75_percent}
              </div>
              <p className="text-xs text-muted-foreground">
                {overall_stats.days_needed_for_75_percent === 0 
                  ? "Already above 75%" 
                  : "consecutive days needed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Alert */}
        {overall_stats.attendance_percentage < 75 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Attendance Warning:</strong> Your attendance is below the required 75%. 
              You need to attend {overall_stats.days_needed_for_75_percent} consecutive classes to reach the minimum requirement.
            </AlertDescription>
          </Alert>
        )}

        {/* Subject-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject-wise Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subject_wise_attendance.map((subject, index) => {
                const status = getAttendanceStatus(subject.attendance_percentage);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{subject.subject_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {subject.subject_code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {subject.classes_attended}/{subject.total_classes} classes
                        </span>
                        <span className={status.color}>
                          {subject.attendance_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={subject.attendance_percentage} className="mb-1" />
                      <Badge 
                        variant={subject.attendance_percentage >= 75 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {subject.attendance_percentage >= 75 ? "✓ Good" : "⚠ Low"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance History */}
        {attendanceData.recent_attendance && attendanceData.recent_attendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Recent Attendance (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceData.recent_attendance.slice(0, 10).map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{record.subject_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })} • Period {record.period_number}
                        </p>
                      </div>
                    </div>
                    <Badge variant={record.status === 'present' ? "default" : "destructive"}>
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
