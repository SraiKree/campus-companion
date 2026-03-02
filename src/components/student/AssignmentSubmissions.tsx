import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentWithSubmission {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  total_marks: number;
  status: 'pending' | 'submitted' | 'graded';
  marks?: number;
  file_url?: string;
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'bg-warning/15 text-warning-foreground border-warning/30' },
  submitted: { icon: CheckCircle, label: 'Submitted', color: 'bg-primary/10 text-primary border-primary/20' },
  graded: { icon: FileText, label: 'Graded', color: 'bg-success/15 text-success border-success/30' },
};

const AssignmentSubmissions = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      // Get all assignments
      const { data: allAssignments } = await supabase
        .from('assignments')
        .select('*')
        .order('deadline', { ascending: true });

      // Get student's submissions
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id);

      const submissionMap = new Map((submissions || []).map(s => [s.assignment_id, s]));

      const merged = (allAssignments || []).map(a => {
        const sub = submissionMap.get(a.id);
        let status: 'pending' | 'submitted' | 'graded' = 'pending';
        if (sub) {
          status = sub.marks !== null && sub.marks !== undefined ? 'graded' : 'submitted';
        }
        return {
          id: a.id,
          title: a.title,
          subject: a.subject,
          description: a.description || '',
          deadline: a.deadline,
          total_marks: a.total_marks,
          status,
          marks: sub?.marks,
          file_url: sub?.file_url,
        };
      });

      setAssignments(merged);
      setLoading(false);
    };

    fetchAssignments();
  }, [user]);

  const handleUpload = async (assignmentId: string) => {
    if (!user) return;
    // For now, create a submission record (file upload can be enhanced with Storage)
    const { error } = await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: user.id,
      file_url: 'uploaded',
    });
    if (!error) {
      setAssignments(prev => prev.map(a =>
        a.id === assignmentId ? { ...a, status: 'submitted' as const, file_url: 'uploaded' } : a
      ));
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading assignments...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-heading font-semibold text-foreground">Assignments</h2>

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No assignments yet</p>
        ) : (
          assignments.map((assignment) => {
            const config = statusConfig[assignment.status];
            const Icon = config.icon;
            const isOverdue = assignment.status === 'pending' && new Date(assignment.deadline) < new Date();

            return (
              <Card key={assignment.id} className="shadow-card">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm text-foreground">{assignment.title}</h3>
                        <Badge variant="outline" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{assignment.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          Deadline: {assignment.deadline}
                        </span>
                        {assignment.status === 'graded' && (
                          <span className="text-xs font-medium text-success">
                            Marks: {assignment.marks}/{assignment.total_marks}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.status === 'pending' && (
                      <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleUpload(assignment.id)}>
                        <Upload className="h-3 w-3" /> Upload
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmissions;
