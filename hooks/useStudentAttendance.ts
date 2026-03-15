import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  roll_number: string;
  name: string;
  section: string;
  department: string;
  semester: string;
}

interface OverallStats {
  total_classes: number;
  classes_attended: number;
  attendance_percentage: number;
  days_needed_for_75_percent: number;
}

interface SubjectAttendance {
  subject_name: string;
  subject_code: string;
  total_classes: number;
  classes_attended: number;
  attendance_percentage: number;
}

interface RecentAttendanceRecord {
  date: string;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  weekday: number;
  period_number: number;
  status: 'present' | 'absent';
}

interface AttendanceData {
  student: Student;
  overall_stats: OverallStats;
  subject_wise_attendance: SubjectAttendance[];
  recent_attendance: RecentAttendanceRecord[];
}

export const useStudentAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);

  useEffect(() => {
    if (user?.roll_no) {
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!user?.roll_no) {
      setError('No roll number found for user');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean the roll number for the API call
      const cleanRollNumber = user.roll_no.trim();
      const response = await fetch(`/api/student/attendance?rollNumber=${encodeURIComponent(cleanRollNumber)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 85) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (percentage >= 75) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (percentage >= 65) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const getWeekdayName = (weekday: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[weekday] || 'Unknown';
  };

  return {
    loading,
    error,
    attendanceData,
    refetch: fetchAttendanceData,
    getAttendanceStatus,
    getWeekdayName,
  };
};