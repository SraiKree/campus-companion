import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Assignment } from '@/types/erp';

const mockAssignments: Assignment[] = [
  { id: '1', title: 'Binary Tree Traversal Implementation', subject: 'Data Structures', description: 'Implement pre/in/post-order traversals', deadline: '2026-03-05', status: 'pending', totalMarks: 20 },
  { id: '2', title: 'Process Scheduling Simulation', subject: 'Operating Systems', description: 'Simulate FCFS, SJF, Round Robin', deadline: '2026-02-28', status: 'submitted', totalMarks: 25, fileUrl: 'submitted.pdf' },
  { id: '3', title: 'ER Diagram for Hospital DB', subject: 'Database Systems', description: 'Design complete ER diagram', deadline: '2026-02-20', status: 'graded', totalMarks: 15, marks: 13, fileUrl: 'er_diagram.pdf' },
  { id: '4', title: 'TCP/IP Protocol Analysis', subject: 'Computer Networks', description: 'Analyze packet flow using Wireshark', deadline: '2026-03-10', status: 'pending', totalMarks: 30 },
];

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'bg-warning/15 text-warning-foreground border-warning/30' },
  submitted: { icon: CheckCircle, label: 'Submitted', color: 'bg-primary/10 text-primary border-primary/20' },
  graded: { icon: FileText, label: 'Graded', color: 'bg-success/15 text-success border-success/30' },
};

const AssignmentSubmissions = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-heading font-semibold text-foreground">Assignments</h2>

      <div className="space-y-3">
        {mockAssignments.map((assignment) => {
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
                          Marks: {assignment.marks}/{assignment.totalMarks}
                        </span>
                      )}
                    </div>
                  </div>
                  {assignment.status === 'pending' && (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1">
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentSubmissions;
