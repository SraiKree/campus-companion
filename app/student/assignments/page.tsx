'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

type AssignmentStatus = 'pending' | 'submitted' | 'graded';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  subject_code?: string;
  description?: string;
  deadline?: string;
  total_marks?: number;
  class_name?: string;
  created_at?: string;
  status?: AssignmentStatus;
  marks?: number | null;
  feedback?: string | null;
  file_url?: string | null;
  submitted_at?: string | null;
}

const statusOptions: Array<{ value: AssignmentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
];

export default function StudentAssignmentsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/student/assignments', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || 'Failed to load assignments');
      }

      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError((err as Error)?.message || 'Unable to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'student') {
      fetchAssignments();
    }
  }, [loading, isAuthenticated, user]);

  const subjects = useMemo(() => {
    const unique = new Set<string>();
    assignments.forEach((a) => {
      if (a.subject) unique.add(a.subject);
    });
    return Array.from(unique);
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const statusMatch = statusFilter === 'all' || a.status === statusFilter;
      const subjectMatch = subjectFilter === 'all' || a.subject === subjectFilter;
      return statusMatch && subjectMatch;
    });
  }, [assignments, statusFilter, subjectFilter]);

  const getStatusBadge = (status?: AssignmentStatus) => {
    switch (status) {
      case 'graded':
        return <Badge variant="default">Graded</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const openSubmissionDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedAssignment) return;

    if (!selectedFile) {
      toast({ title: 'Select a file', description: 'Please choose a file to upload.', variant: 'destructive' });
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload a file smaller than 15MB.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const studentId = session.data.session?.user?.id;
      if (!token || !studentId) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment.id);
      formData.append('studentId', studentId);
      formData.append('file', selectedFile);

      const res = await fetch('/api/student/submit-assignment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed');
      }

      toast({ title: 'Submitted', description: 'Your assignment has been uploaded.' });
      setOpenDialog(false);
      setSelectedFile(null);
      setSelectedAssignment(null);

      await fetchAssignments();
    } catch (err) {
      console.error('Submission error', err);
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingAssignments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/student/attendance">
              <Button variant="ghost">Attendance</Button>
            </Link>
            <Button className="bg-black text-white">Assignments</Button>
            <Link href="/student/grades">
              <Button variant="ghost">Grades</Button>
            </Link>
            <Link href="/student/leave-request">
              <Button variant="ghost">Leave Request</Button>
            </Link>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assignments</h1>
            <p className="text-sm text-muted-foreground mt-1">View and submit assignments for your classes.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Subject</span>
              <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : null}

        {filteredAssignments.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-muted-foreground">No assignments found for the selected filters.</p>
          </div>
        ) : (
          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle className="text-lg">Your Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{assignment.title}</span>
                          {assignment.description ? (
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {assignment.description}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>
                        {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>
                        {assignment.status === 'graded' ? (
                          <span className="font-semibold">{assignment.marks ?? '—'}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {assignment.file_url ? (
                            <a
                              className="text-sm font-medium text-primary hover:underline"
                              href={assignment.file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          ) : null}
                          <Button
                            size="sm"
                            disabled={assignment.status === 'graded' || isSubmitting}
                            onClick={() => openSubmissionDialog(assignment)}
                          >
                            {assignment.status === 'pending' ? 'Submit' : 'Resubmit'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4">
                Grades and feedback will appear once your instructor reviews the submission.
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedAssignment ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{selectedAssignment.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.subject}</p>
                  {selectedAssignment.deadline ? (
                    <p className="text-sm text-muted-foreground">Deadline: {new Date(selectedAssignment.deadline).toLocaleString()}</p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium">Choose file</label>
                <input
                  type="file"
                  className="mt-2 w-full"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">Allowed file types: PDF, DOCX, ZIP (max 15MB)</p>
              </div>

              {selectedFile ? (
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? 'Uploading…' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
