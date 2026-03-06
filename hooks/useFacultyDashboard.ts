import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FacultyStats {
  totalStudents: number;
  avgAttendance: number;
  pendingReviews: number;
}

interface UpcomingClass {
  time: string;
  subject: string;
  section: string;
  room: string;
  students: number;
}

interface RecentSubmission {
  student: string;
  assignment: string;
  subject: string;
  time: string;
  score: number | null;
}

interface ClassPerformance {
  section: string;
  attendance: number;
  avgScore: number;
}

export const useFacultyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FacultyStats>({
    totalStudents: 0,
    avgAttendance: 0,
    pendingReviews: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ day: string; classes: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUpcomingClasses(),
        fetchRecentSubmissions(),
        fetchClassPerformance(),
        fetchWeeklyStats(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Get unique students taught by this faculty
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('student_id, present')
      .eq('faculty_id', user!.id);

    if (attendanceData) {
      const uniqueStudents = new Set(attendanceData.map(a => a.student_id));
      const totalStudents = uniqueStudents.size;
      const totalRecords = attendanceData.length;
      const presentRecords = attendanceData.filter(a => a.present).length;
      const avgAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

      // Get pending reviews
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('id, assignment:assignments!inner(faculty_id)')
        .is('marks', null);

      const pendingReviews = submissions?.filter((s: any) => s.assignment?.faculty_id === user!.id).length || 0;

      setStats({
        totalStudents,
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        pendingReviews,
      });
    }
  };

  const fetchUpcomingClasses = async () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const { data } = await supabase
      .from('timetable')
      .select('start_time, subject, class_name')
      .eq('faculty_id', user!.id)
      .eq('day', today)
      .order('start_time');

    if (data) {
      const classes: UpcomingClass[] = await Promise.all(
        data.map(async (c, idx) => {
          // Count students in this class
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('class_name', c.class_name);

          return {
            time: c.start_time,
            subject: c.subject,
            section: c.class_name,
            room: `Lab ${301 + idx}`,
            students: count || 0,
          };
        })
      );
      setUpcomingClasses(classes);
    }
  };

  const fetchRecentSubmissions = async () => {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, subject')
      .eq('faculty_id', user!.id);

    if (!assignments) return;

    const assignmentIds = assignments.map(a => a.id);
    
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, student_id, marks, submitted_at')
      .in('assignment_id', assignmentIds)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (submissions) {
      const studentIds = submissions.map(s => s.student_id);
      const { data: students } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);

      const studentMap = new Map(students?.map(s => [s.id, s.name]) || []);
      const assignmentMap = new Map(assignments.map(a => [a.id, a]));

      const formatted: RecentSubmission[] = submissions.map(s => {
        const assignment = assignmentMap.get(s.assignment_id);
        const submittedDate = new Date(s.submitted_at);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let timeStr = '';
        if (diffDays > 0) {
          timeStr = `${diffDays}d ago`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours}h ago`;
        } else {
          timeStr = 'Just now';
        }

        return {
          student: studentMap.get(s.student_id) || 'Unknown',
          assignment: assignment?.title || 'Unknown',
          subject: assignment?.subject || '',
          time: timeStr,
          score: s.marks,
        };
      });

      setRecentSubmissions(formatted);
    }
  };

  const fetchClassPerformance = async () => {
    const { data: timetable } = await supabase
      .from('timetable')
      .select('class_name, subject')
      .eq('faculty_id', user!.id);

    if (!timetable) return;

    const uniqueClasses = Array.from(new Set(timetable.map(t => t.class_name)));
    
    const performance: ClassPerformance[] = await Promise.all(
      uniqueClasses.slice(0, 3).map(async (className) => {
        // Get attendance for this class
        const { data: attendance } = await supabase
          .from('attendance')
          .select('present')
          .eq('faculty_id', user!.id)
          .eq('class_name', className);

        const attendanceRate = attendance && attendance.length > 0
          ? (attendance.filter(a => a.present).length / attendance.length) * 100
          : 0;

        // Get assignment scores for this class
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, total_marks')
          .eq('faculty_id', user!.id)
          .eq('class_name', className);

        let avgScore = 0;
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('marks, assignment_id')
            .in('assignment_id', assignmentIds)
            .not('marks', 'is', null);

          if (submissions && submissions.length > 0) {
            const assignmentMap = new Map(assignments.map(a => [a.id, a.total_marks]));
            const totalPercentage = submissions.reduce((sum, s) => {
              const totalMarks = assignmentMap.get(s.assignment_id) || 100;
              return sum + ((s.marks || 0) / totalMarks) * 100;
            }, 0);
            avgScore = totalPercentage / submissions.length;
          }
        }

        const subjectName = timetable.find(t => t.class_name === className)?.subject || '';
        
        return {
          section: `${className} (${subjectName})`,
          attendance: Math.round(attendanceRate),
          avgScore: Math.round(avgScore),
        };
      })
    );

    setClassPerformance(performance);
  };

  const fetchWeeklyStats = async () => {
    const { data } = await supabase
      .from('timetable')
      .select('day')
      .eq('faculty_id', user!.id);

    if (data) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = new Map<string, number>();
      
      data.forEach(t => {
        const shortDay = t.day.substring(0, 3);
        dayMap.set(shortDay, (dayMap.get(shortDay) || 0) + 1);
      });

      const weeklyData = days.map(day => ({
        day,
        classes: dayMap.get(day) || 0,
      }));

      setWeeklyStats(weeklyData);
    }
  };

  return {
    loading,
    stats,
    upcomingClasses,
    recentSubmissions,
    classPerformance,
    weeklyStats,
    refetch: fetchDashboardData,
  };
};
