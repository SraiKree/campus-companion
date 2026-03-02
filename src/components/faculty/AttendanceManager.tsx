import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Users } from 'lucide-react';
import type { StudentAttendanceRecord } from '@/types/erp';

const mockStudents: StudentAttendanceRecord[] = [
  { id: '1', name: 'Arjun Sharma', rollNo: 'CSE001', present: true },
  { id: '2', name: 'Priya Patel', rollNo: 'CSE002', present: true },
  { id: '3', name: 'Rahul Kumar', rollNo: 'CSE003', present: false },
  { id: '4', name: 'Sneha Gupta', rollNo: 'CSE004', present: true },
  { id: '5', name: 'Vikram Singh', rollNo: 'CSE005', present: false },
  { id: '6', name: 'Ananya Reddy', rollNo: 'CSE006', present: true },
  { id: '7', name: 'Karthik Nair', rollNo: 'CSE007', present: true },
  { id: '8', name: 'Divya Joshi', rollNo: 'CSE008', present: true },
];

const AttendanceManager = () => {
  const [students, setStudents] = useState(mockStudents);
  const [classFilter, setClassFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);

  const togglePresent = (id: string) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, present: !st.present } : st));
    setSaved(false);
  };

  const markAll = (present: boolean) => {
    setStudents(s => s.map(st => ({ ...st, present })));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    // TODO: Save to Supabase
  };

  const presentCount = students.filter(s => s.present).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-heading font-semibold text-foreground">Mark Attendance</h2>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE-A">CSE-A</SelectItem>
                  <SelectItem value="CSE-B">CSE-B</SelectItem>
                  <SelectItem value="ECE-A">ECE-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ds">Data Structures</SelectItem>
                  <SelectItem value="os">Operating Systems</SelectItem>
                  <SelectItem value="db">Database Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-heading">Students</CardTitle>
              <Badge variant="secondary">{presentCount}/{students.length} Present</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => markAll(true)}>All Present</Button>
              <Button size="sm" variant="outline" onClick={() => markAll(false)}>All Absent</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map(student => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  student.present ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    student.present ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {student.rollNo.slice(-2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${student.present ? 'text-success' : 'text-destructive'}`}>
                    {student.present ? 'Present' : 'Absent'}
                  </span>
                  <Switch checked={student.present} onCheckedChange={() => togglePresent(student.id)} />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full mt-4 gradient-primary text-primary-foreground gap-2">
            <Save className="h-4 w-4" />
            {saved ? '✓ Saved' : 'Save Attendance'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManager;
