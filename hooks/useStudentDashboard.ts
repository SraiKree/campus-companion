import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceStats(),
        fetchAssignments(),
        fetchTodayClasses(),
        fetchSubjectPerformance(),
        fetchWeeklyAttendance(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
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

  const fetchTodayClasses = async () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_name')
      .eq('id', user!.id)
      .single();

    if (!profile?.class_name) return;

    const { data } = await supabase
      .from('timetable')
      .select('start_time, subject, class_name')
      .eq('class_name', profile.class_name)
      .eq('day', today)
      .order('start_time');

    if (data) {
      const classes: TodayClass[] = data.map((c, idx) => ({
        time: c.start_time,
        subject: c.subject,
        room: `Room ${101 + idx}`,
      }));
      setTodayClasses(classes);
    }
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
    refetch: fetchDashboardData,
  };
};
