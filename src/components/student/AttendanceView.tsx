import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { AttendanceRecord } from '@/types/erp';

const mockAttendance: AttendanceRecord[] = [
  { subject: 'Data Structures', subjectCode: 'CS201', totalClasses: 40, attended: 36, percentage: 90 },
  { subject: 'Operating Systems', subjectCode: 'CS301', totalClasses: 38, attended: 34, percentage: 89 },
  { subject: 'Database Systems', subjectCode: 'CS302', totalClasses: 35, attended: 24, percentage: 69 },
  { subject: 'Computer Networks', subjectCode: 'CS303', totalClasses: 42, attended: 38, percentage: 90 },
  { subject: 'Mathematics III', subjectCode: 'MA201', totalClasses: 36, attended: 25, percentage: 69 },
  { subject: 'Soft Skills', subjectCode: 'HS201', totalClasses: 20, attended: 18, percentage: 90 },
];

const AttendanceView = () => {
  const overall = Math.round(
    mockAttendance.reduce((s, r) => s + r.percentage, 0) / mockAttendance.length
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overall Attendance</p>
            <p className={`text-3xl font-heading font-bold mt-1 ${overall < 75 ? 'text-destructive' : 'text-success'}`}>
              {overall}%
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Subjects</p>
            <p className="text-3xl font-heading font-bold mt-1 text-foreground">{mockAttendance.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Low Attendance</p>
            <p className="text-3xl font-heading font-bold mt-1 text-destructive">
              {mockAttendance.filter(r => r.percentage < 75).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Subject-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {mockAttendance.map((record) => (
            <div key={record.subjectCode} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-foreground">{record.subject}</span>
                  <span className="text-xs text-muted-foreground ml-2">({record.subjectCode})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {record.attended}/{record.totalClasses}
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceView;
