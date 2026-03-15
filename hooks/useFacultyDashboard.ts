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

interface LeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_roll_no?: string | null;
  class_name?: string | null;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
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
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

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
        fetchLeaveRequests(),
        fetchClassPerformance(),
        fetchWeeklyStats(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/faculty/leave-requests', {
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
    const today = new Date();
    const currentWeekday = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayWeekday = currentWeekday === 0 ? 7 : currentWeekday; // Convert Sunday to 7
    
    const { data } = await supabase
      .from('faculty_classes')
      .select('subject_name, subject_code, department, section, period_start, period_end, room_number')
      .eq('faculty_id', user!.id)
      .eq('weekday', todayWeekday)
      .order('period_start');

    if (data) {
      const periodTimes = [
        '9:20-10:20',
        '10:20-11:20', 
        '11:20-12:20',
        '1:10-2:10',
        '2:10-3:10',
        '3:10-4:10'
      ];

      const classes: UpcomingClass[] = await Promise.all(
        data.map(async (c, idx) => {
          // Estimate students based on section (rough estimate)
          const estimatedStudents = 60; // Default estimate

          return {
            time: periodTimes[c.period_start - 1] || `Period ${c.period_start}`,
            subject: `${c.subject_code} - ${c.subject_name}`,
            section: `${c.department}-${c.section}`,
            room: c.room_number || `Room ${301 + idx}`,
            students: estimatedStudents,
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
    const { data: classes } = await supabase
      .from('faculty_classes')
      .select('subject_name, department, section')
      .eq('faculty_id', user!.id);

    if (!classes) return;

    // Group by department-section combination
    const uniqueClasses = Array.from(
      new Set(classes.map(c => `${c.department}-${c.section}`))
    ).slice(0, 3);
    
    const performance: ClassPerformance[] = uniqueClasses.map((classKey) => {
      // For now, return mock data since we don't have attendance integrated yet
      const [department, section] = classKey.split('-');
      const subjects = classes
        .filter(c => `${c.department}-${c.section}` === classKey)
        .map(c => c.subject_name)
        .join(', ');

      return {
        section: `${classKey} (${subjects})`,
        attendance: Math.floor(Math.random() * 20) + 80, // Mock data: 80-100%
        avgScore: Math.floor(Math.random() * 20) + 75,   // Mock data: 75-95%
      };
    });

    setClassPerformance(performance);
  };

  const fetchWeeklyStats = async () => {
    const { data } = await supabase
      .from('faculty_classes')
      .select('weekday')
      .eq('faculty_id', user!.id);

    if (data) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = new Map<string, number>();
      
      data.forEach(c => {
        // Convert weekday number to day name
        const dayName = days[c.weekday - 1]; // weekday is 1-7, array is 0-6
        if (dayName) {
          dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1);
        }
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
    leaveRequests,
    refetch: fetchDashboardData,
  };
};
