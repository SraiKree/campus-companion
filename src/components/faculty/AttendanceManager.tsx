import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StudentRecord {
  id: string;
  name: string;
  roll_no: string;
  present: boolean;
}

const AttendanceManager = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  // Fetch unique classes and subjects from timetable
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('timetable')
        .select('class_name, subject')
        .eq('faculty_id', user.id);
      if (data) {
        setClasses([...new Set(data.map(d => d.class_name))]);
        setSubjects([...new Set(data.map(d => d.subject))]);
      }
    };
    fetch();
  }, [user]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!classFilter) { setStudents([]); return; }
    const fetchStudents = async () => {
      // Get students in the selected class
      const { data } = await supabase
        .from('profiles')
        .select('id, name, roll_no')
        .eq('class_name', classFilter);

      // Check existing attendance for this date/subject
      const { data: existing } = await supabase
        .from('attendance')
        .select('student_id, present')
        .eq('subject', subject)
        .eq('date', date)
        .eq('class_name', classFilter);

      const existingMap = new Map((existing || []).map(e => [e.student_id, e.present]));

      setStudents((data || []).map(s => ({
        id: s.id,
        name: s.name,
        roll_no: s.roll_no || '',
        present: existingMap.get(s.id) ?? true,
      })));
    };
    if (subject) fetchStudents();
  }, [classFilter, subject, date]);

  const togglePresent = (id: string) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, present: !st.present } : st));
  };

  const markAll = (present: boolean) => {
    setStudents(s => s.map(st => ({ ...st, present })));
  };

  const handleSave = async () => {
    if (!user || !subject || !classFilter) return;
    setSaving(true);

    const records = students.map(s => ({
      student_id: s.id,
      faculty_id: user.id,
      subject,
      class_name: classFilter,
      date,
      present: s.present,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,subject,date' });

    setSaving(false);
    if (error) {
      toast.error('Failed to save attendance');
    } else {
      toast.success('Attendance saved!');
    }
  };

  const presentCount = students.filter(s => s.present).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-heading font-semibold text-foreground">Mark Attendance</h2>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      {students.length > 0 && (
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
                      {student.roll_no.slice(-2) || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.roll_no}</p>
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

            <Button onClick={handleSave} disabled={saving} className="w-full mt-4 gradient-primary text-primary-foreground gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </CardContent>
        </Card>
      )}

      {students.length === 0 && classFilter && subject && (
        <p className="text-sm text-muted-foreground text-center py-8">No students found in this class</p>
      )}
    </div>
  );
};

export default AttendanceManager;
