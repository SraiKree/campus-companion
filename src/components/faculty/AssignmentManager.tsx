import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Download, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  submitted_at: string;
  file_url: string;
  marks?: number;
  feedback?: string;
}

interface FacultyAssignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  total_marks: number;
  submissions: Submission[];
}

const AssignmentManager = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', description: '', deadline: '', totalMarks: '20' });
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  const fetchAssignments = async () => {
    if (!user) return;
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*')
      .eq('faculty_id', user.id)
      .order('created_at', { ascending: false });

    if (!assignmentData) { setLoading(false); return; }

    // Fetch submissions with student profiles
    const assignmentIds = assignmentData.map(a => a.id);
    const { data: submissionData } = await supabase
      .from('assignment_submissions')
      .select('*, profiles:student_id(name, roll_no)')
      .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['none']);

    const submissionsByAssignment = new Map<string, Submission[]>();
    (submissionData || []).forEach((s: any) => {
      const list = submissionsByAssignment.get(s.assignment_id) || [];
      list.push({
        id: s.id,
        student_id: s.student_id,
        student_name: s.profiles?.name || 'Unknown',
        roll_no: s.profiles?.roll_no || '',
        submitted_at: s.submitted_at,
        file_url: s.file_url || '',
        marks: s.marks,
        feedback: s.feedback,
      });
      submissionsByAssignment.set(s.assignment_id, list);
    });

    setAssignments(assignmentData.map(a => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      description: a.description || '',
      deadline: a.deadline,
      total_marks: a.total_marks,
      submissions: submissionsByAssignment.get(a.id) || [],
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('assignments').insert({
      faculty_id: user.id,
      title: form.title,
      subject: form.subject,
      description: form.description,
      deadline: form.deadline,
      total_marks: parseInt(form.totalMarks) || 20,
    });
    if (!error) {
      setForm({ title: '', subject: '', description: '', deadline: '', totalMarks: '20' });
      setCreateOpen(false);
      fetchAssignments();
    }
  };

  const handleGrade = async (submissionId: string) => {
    const { error } = await supabase
      .from('assignment_submissions')
      .update({ marks: parseInt(gradeForm.marks), feedback: gradeForm.feedback })
      .eq('id', submissionId);

    if (!error) {
      toast.success('Grade saved!');
      setGradingId(null);
      setGradeForm({ marks: '', feedback: '' });
      fetchAssignments();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading assignments...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground">Assignments</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} required />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Create Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No assignments created yet</p>
      ) : (
        assignments.map(assignment => (
          <Card key={assignment.id} className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-heading">{assignment.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{assignment.subject} • Deadline: {assignment.deadline}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{assignment.description}</p>
                </div>
                <Badge variant="secondary">{assignment.submissions.length} Submissions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {assignment.submissions.length > 0 ? (
                <div className="space-y-2">
                  {assignment.submissions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sub.student_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.roll_no} • {new Date(sub.submitted_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.marks !== undefined && sub.marks !== null ? (
                          <Badge className="bg-success/15 text-success border-success/30" variant="outline">
                            {sub.marks}/{assignment.total_marks}
                          </Badge>
                        ) : (
                          <Dialog open={gradingId === sub.id} onOpenChange={o => { setGradingId(o ? sub.id : null); setGradeForm({ marks: '', feedback: '' }); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1 text-xs">
                                <MessageSquare className="h-3 w-3" /> Grade
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="font-heading">Grade: {sub.student_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Marks (out of {assignment.total_marks})</Label>
                                  <Input type="number" min="0" max={assignment.total_marks} value={gradeForm.marks} onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Feedback</Label>
                                  <Textarea value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} />
                                </div>
                                <Button onClick={() => handleGrade(sub.id)} className="w-full gradient-primary text-primary-foreground">
                                  Save Grade
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default AssignmentManager;
