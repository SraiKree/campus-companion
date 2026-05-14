import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AnnouncementRecord } from '@/lib/announcements';

interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  attendanceRate: number;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  status: 'pending' | 'submitted';
  marks?: number;
}

interface TodayClass {
  time: string;
  subject: string;
  room: string;
}

interface SubjectPerformance {
  subject: string;
  score: number;
}

interface LeaveRequestSummary {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const useStudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalClasses: 0,
    presentClasses: 0,
    attendanceRate: 0,
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<{ day: string; present: number; total: number }[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestSummary[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard data fetch timeout')), 10000)
      );
      
      await Promise.race([
        Promise.all([
          fetchAttendanceStats(),
          fetchAssignments(),
          fetchLeaveRequests(),
          fetchAnnouncements(),
          fetchTodayClasses(),
          fetchSubjectPerformance(),
          fetchWeeklyAttendance(),
        ]),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    if (!user?.roll_no) return;

    try {
      const response = await fetch(`/api/student/attendance?rollNumber=${encodeURIComponent(user.roll_no)}`);
      
      if (response.ok) {
        const data = await response.json();
        const stats = data.overall_stats;
        
        setAttendanceStats({
          totalClasses: stats.total_classes,
          presentClasses: stats.classes_attended,
          attendanceRate: stats.attendance_percentage,
        });
      } else {
        // Fallback to old method if new API fails
        const { data, error } = await supabase
          .from('attendance')
          .select('present')
          .eq('student_id', user!.id);

        if (!error && data) {
          const totalClasses = data.length;
          const presentClasses = data.filter(a => a.present).length;
          const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
          
          setAttendanceStats({
            totalClasses,
            presentClasses,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      // Fallback to old method
      const { data, error: supabaseError } = await supabase
        .from('attendance')
        .select('present')
        .eq('student_id', user!.id);

      if (!supabaseError && data) {
        const totalClasses = data.length;
        const presentClasses = data.filter(a => a.present).length;
        const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
        
        setAttendanceStats({
          totalClasses,
          presentClasses,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
        });
      }
    }
  };

  const fetchAssignments = async () => {
    // Get student's class
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_name')
      .eq('id', user!.id)
      .single();

    if (!profile?.class_name) return;

    // Fetch assignments for student's class
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('id, title, subject, deadline')
      .eq('class_name', profile.class_name)
      .order('deadline', { ascending: true })
      .limit(5);

    if (assignmentsData) {
      // Check submission status
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, marks')
        .eq('student_id', user!.id);

      const submissionMap = new Map(submissions?.map(s => [s.assignment_id, s]) || []);

      const formattedAssignments: Assignment[] = assignmentsData.map(a => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        deadline: new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: submissionMap.has(a.id) ? 'submitted' : 'pending',
        marks: submissionMap.get(a.id)?.marks,
      }));

      setAssignments(formattedAssignments);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/student/leave-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setLeaveRequests(Array.isArray(data?.leaveRequests) ? data.leaveRequests : []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/student/announcements', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchTodayClasses = async () => {
    // For now, return empty array since we don't have student timetable integration
    // This can be implemented later when student-faculty class relationships are established
    setTodayClasses([]);
  };

  const fetchSubjectPerformance = async () => {
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('marks, assignment:assignments(subject, total_marks)')
      .eq('student_id', user!.id)
      .not('marks', 'is', null);

    if (submissions) {
      const subjectScores = new Map<string, { total: number; count: number }>();

      submissions.forEach((sub: any) => {
        if (sub.assignment && sub.marks !== null) {
          const subject = sub.assignment.subject;
          const percentage = (sub.marks / sub.assignment.total_marks) * 100;
          
          if (!subjectScores.has(subject)) {
            subjectScores.set(subject, { total: 0, count: 0 });
          }
          const current = subjectScores.get(subject)!;
          current.total += percentage;
          current.count += 1;
        }
      });

      const performance: SubjectPerformance[] = Array.from(subjectScores.entries()).map(([subject, data]) => ({
        subject,
        score: Math.round(data.total / data.count),
      }));

      setSubjectPerformance(performance);
    }
  };

  const fetchWeeklyAttendance = async () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const weeklyData = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { data } = await supabase
        .from('attendance')
        .select('present')
        .eq('student_id', user!.id)
        .eq('date', dateStr);

      const total = data?.length || 0;
      const present = data?.filter(a => a.present).length || 0;

      weeklyData.push({
        day: days[i],
        present,
        total,
      });
    }

    setWeeklyAttendance(weeklyData);
  };

  return {
    loading,
    attendanceStats,
    assignments,
    todayClasses,
    subjectPerformance,
    weeklyAttendance,
    leaveRequests,
    announcements,
    refetch: fetchDashboardData,
  };
};
