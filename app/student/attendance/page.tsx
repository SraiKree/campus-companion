'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAttendance } from '@/hooks/useStudentAttendance';
import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, BookOpen, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading attendance data...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  if (error) {
    return (
      <StudentLayout>
        <Alert className="mb-6 border-[#e05252]/20 bg-[#e05252]/5">
          <AlertTriangle className="h-4 w-4 text-[#e05252]" />
          <AlertDescription className="text-[#1a1a1a]">
            {error}
            <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </StudentLayout>
    );
  }

  if (!attendanceData) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <CalendarDays className="h-12 w-12 text-[#666] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">No Attendance Data</h2>
          <p className="text-[#666]">No attendance records found for your account.</p>
        </div>
      </StudentLayout>
    );
  }

  const { student, overall_stats, subject_wise_attendance } = attendanceData;

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Attendance Overview</h1>
            <p className="text-[#666]">
              {student.name} • {student.roll_number} • {student.department} - {student.section}
            </p>
          </div>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="border-[#e5e5e5] hover:bg-[#f2f0ed]"
          >
            Refresh Data
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider">Overall Attendance</h3>
              <TrendingUp className="h-4 w-4 text-[#666]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1a1a1a] mb-3">
              {overall_stats.attendance_percentage.toFixed(1)}%
            </div>
            <Progress 
              value={overall_stats.attendance_percentage} 
              className="mb-3 h-2 bg-[#f2f0ed]"
            />
            <Badge 
              className={`${
                overall_stats.attendance_percentage >= 75 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                  : 'bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20'
              } hover:bg-opacity-100`}
            >
              {overall_stats.attendance_percentage >= 75 ? "Good Standing" : "Below Requirement"}
            </Badge>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider">Classes Attended</h3>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 mb-1">
              {overall_stats.classes_attended}
            </div>
            <p className="text-xs text-[#666]">
              out of {overall_stats.total_classes} total classes
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider">Classes Missed</h3>
              <XCircle className="h-4 w-4 text-[#e05252]" />
            </div>
            <div className="text-3xl font-extrabold text-[#e05252] mb-1">
              {overall_stats.total_classes - overall_stats.classes_attended}
            </div>
            <p className="text-xs text-[#666]">
              classes missed this semester
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#666] uppercase tracking-wider">Days to 75%</h3>
              <CalendarDays className="h-4 w-4 text-[#666]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1a1a1a] mb-1">
              {overall_stats.days_needed_for_75_percent}
            </div>
            <p className="text-xs text-[#666]">
              {overall_stats.days_needed_for_75_percent === 0 
                ? "Already above 75%" 
                : "consecutive days needed"}
            </p>
          </div>
        </div>

        {/* Attendance Alert */}
        {overall_stats.attendance_percentage < 75 && (
          <Alert className="border-[#e05252]/20 bg-[#e05252]/5">
            <AlertTriangle className="h-4 w-4 text-[#e05252]" />
            <AlertDescription className="text-[#1a1a1a]">
              <strong>Attendance Warning:</strong> Your attendance is below the required 75%. 
              You need to attend {overall_stats.days_needed_for_75_percent} consecutive classes to reach the minimum requirement.
            </AlertDescription>
          </Alert>
        )}

        {/* Subject-wise Attendance */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject-wise Attendance
          </h2>
          <div className="space-y-4">
            {subject_wise_attendance.map((subject, index) => {
              const status = getAttendanceStatus(subject.attendance_percentage);
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-[#1a1a1a]">{subject.subject_name}</h3>
                      <Badge variant="outline" className="text-xs border-[#e5e5e5]">
                        {subject.subject_code}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#666]">
                      <span>
                        {subject.classes_attended}/{subject.total_classes} classes
                      </span>
                      <span className="font-bold">
                        {subject.attendance_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-32">
                    <Progress value={subject.attendance_percentage} className="mb-2 h-2 bg-white" />
                    <Badge 
                      className={`text-xs ${
                        subject.attendance_percentage >= 75 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20'
                      }`}
                    >
                      {subject.attendance_percentage >= 75 ? "✓ Good" : "⚠ Low"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Attendance History */}
        {attendanceData.recent_attendance && attendanceData.recent_attendance.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Recent Attendance (Last 30 Days)
            </h2>
            <div className="space-y-3">
              {attendanceData.recent_attendance.slice(0, 10).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-[#e05252]'}`} />
                    <div>
                      <p className="font-medium text-sm text-[#1a1a1a]">{record.subject_name}</p>
                      <p className="text-xs text-[#666]">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} • Period {record.period_number}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      record.status === 'present' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                        : 'bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20'
                    }`}
                  >
                    {record.status === 'present' ? 'Present' : 'Absent'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
