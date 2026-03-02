import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Download, MessageSquare } from 'lucide-react';
import type { AssignmentSubmission } from '@/types/erp';

interface FacultyAssignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  submissions: AssignmentSubmission[];
}

const mockAssignments: FacultyAssignment[] = [
  {
    id: '1',
    title: 'Binary Tree Traversal Implementation',
    subject: 'Data Structures',
    description: 'Implement pre/in/post-order traversals using recursion and iteration',
    deadline: '2026-03-05',
    submissions: [
      { id: 's1', studentName: 'Arjun Sharma', rollNo: 'CSE001', submittedAt: '2026-03-01', fileUrl: '#', marks: 18, feedback: 'Great work!' },
      { id: 's2', studentName: 'Priya Patel', rollNo: 'CSE002', submittedAt: '2026-03-02', fileUrl: '#' },
      { id: 's3', studentName: 'Sneha Gupta', rollNo: 'CSE004', submittedAt: '2026-03-04', fileUrl: '#', marks: 15 },
    ],
  },
  {
    id: '2',
    title: 'Process Scheduling Simulation',
    subject: 'Operating Systems',
    description: 'Simulate FCFS, SJF, and Round Robin scheduling',
    deadline: '2026-03-10',
    submissions: [
      { id: 's4', studentName: 'Rahul Kumar', rollNo: 'CSE003', submittedAt: '2026-03-08', fileUrl: '#' },
    ],
  },
];

const AssignmentManager = () => {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', description: '', deadline: '' });
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignments([...assignments, {
      id: Date.now().toString(),
      ...form,
      submissions: [],
    }]);
    setForm({ title: '', subject: '', description: '', deadline: '' });
    setCreateOpen(false);
  };

  const handleGrade = (assignmentId: string, submissionId: string) => {
    setAssignments(as => as.map(a => {
      if (a.id !== assignmentId) return a;
      return {
        ...a,
        submissions: a.submissions.map(s =>
          s.id === submissionId
            ? { ...s, marks: Number(gradeForm.marks), feedback: gradeForm.feedback }
            : s
        ),
      };
    }));
    setGradingId(null);
    setGradeForm({ marks: '', feedback: '' });
  };

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
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Create Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.map(assignment => (
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
                        <p className="text-sm font-medium text-foreground">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground">{sub.rollNo} • {sub.submittedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.marks !== undefined ? (
                        <Badge className="bg-success/15 text-success border-success/30" variant="outline">
                          {sub.marks}/20
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
                              <DialogTitle className="font-heading">Grade: {sub.studentName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Marks (out of 20)</Label>
                                <Input type="number" min="0" max="20" value={gradeForm.marks} onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                <Label>Feedback</Label>
                                <Textarea value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} />
                              </div>
                              <Button onClick={() => handleGrade(assignment.id, sub.id)} className="w-full gradient-primary text-primary-foreground">
                                Save Grade
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignmentManager;
