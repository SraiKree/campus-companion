import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SubjectAttendance {
  subject: string;
  subject_code: string;
  total: number;
  attended: number;
  percentage: number;
}

const AttendanceView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('subject, subject_code, present')
        .eq('student_id', user.id);

      if (error) {
        console.error('Error fetching attendance:', error);
        setLoading(false);
        return;
      }

      // Group by subject
      const grouped: Record<string, { subject: string; subject_code: string; total: number; attended: number }> = {};
      (data || []).forEach(row => {
        const key = row.subject;
        if (!grouped[key]) {
          grouped[key] = { subject: row.subject, subject_code: row.subject_code || '', total: 0, attended: 0 };
        }
        grouped[key].total++;
        if (row.present) grouped[key].attended++;
      });

      const result = Object.values(grouped).map(g => ({
        ...g,
        percentage: g.total > 0 ? Math.round((g.attended / g.total) * 100) : 0,
      }));

      setAttendance(result);
      setLoading(false);
    };

    fetchAttendance();
  }, [user]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>;
  }

  const overall = attendance.length > 0
    ? Math.round(attendance.reduce((s, r) => s + r.percentage, 0) / attendance.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overall Attendance</p>
            <p className={`text-3xl font-heading font-bold mt-1 ${overall < 75 ? 'text-destructive' : 'text-success'}`}>
              {attendance.length > 0 ? `${overall}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Subjects</p>
            <p className="text-3xl font-heading font-bold mt-1 text-foreground">{attendance.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Low Attendance</p>
            <p className="text-3xl font-heading font-bold mt-1 text-destructive">
              {attendance.filter(r => r.percentage < 75).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Subject-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet</p>
          ) : (
            attendance.map((record) => (
              <div key={record.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-foreground">{record.subject}</span>
                    {record.subject_code && (
                      <span className="text-xs text-muted-foreground ml-2">({record.subject_code})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {record.attended}/{record.total}
                    </span>
                    <Badge variant={record.percentage < 75 ? 'destructive' : 'default'}
                      className={record.percentage >= 75 ? 'bg-success text-success-foreground' : ''}>
                      {record.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={record.percentage}
                  className={`h-2 ${record.percentage < 75 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceView;
