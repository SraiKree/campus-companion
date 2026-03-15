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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  class_name?: string;
  deadline?: string;
  total_marks?: number;
  description?: string;
  created_at?: string;
  submission_count?: number;
  pending_reviews?: number;
  graded_count?: number;
}

interface Submission {
  student_id: string;
  student_name: string;
  submitted_at: string;
  file_url?: string;
  marks?: number | null;
  feedback?: string | null;
}

export default function FacultyAssignmentsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<Array<{ id: string; department: string; section: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionList, setSubmissionList] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subject: '',
    class_name: '',
    deadline: '',
    total_marks: '',
    description: '',
  });

  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    marks: '',
    feedback: '',
  });

  const [customClass, setCustomClass] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'faculty') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      fetchAssignments();
      fetchClasses();
    }
  }, [loading, isAuthenticated, user]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/faculty/assignments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load assignments');
      }

      const data = await res.json();
      setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError((err as Error)?.message || 'Unable to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    setClassesError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/faculty/classes?facultyId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load classes');
      }

      const data = await res.json();
      setClasses(Array.isArray(data?.classes) ? data.classes : []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClassesError((err as Error)?.message || 'Unable to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const openCreateDialog = () => {
    setForm({ title: '', subject: '', class_name: '', deadline: '', total_marks: '', description: '' });
    setCustomClass('');
    setIsCreateOpen(true);
  };

  const handleCreateAssignment = async () => {
    const className = form.class_name === '__custom' ? customClass : form.class_name;

    if (!form.title || !form.subject || !className) {
      toast({ title: 'Missing fields', description: 'Title, subject and class are required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const className = form.class_name === '__custom' ? customClass : form.class_name;

      const payload = {
        title: form.title,
        subject: form.subject,
        class_name: className,
        deadline: form.deadline || null,
        total_marks: form.total_marks ? Number(form.total_marks) : null,
        description: form.description || null,
      };

      const res = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create assignment');
      }

      setIsCreateOpen(false);
      setCustomClass('');
      toast({ title: 'Assignment created', description: 'Your assignment has been saved.' });
      await fetchAssignments();
    } catch (err) {
      console.error('Create assignment error:', err);
      toast({ title: 'Create failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSubmissionsDialog = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsSubmissionsOpen(true);
    await fetchSubmissions(assignment.id);
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/faculty/assignments/${assignmentId}/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load submissions');
      }

      const data = await res.json();
      setSubmissionList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
      toast({ title: 'Load failed', description: (err as Error).message, variant: 'destructive' });
      setSubmissionList([]);
    }
  };

  const handleGrade = async () => {
    if (!selectedAssignment) return;
    if (!gradeForm.studentId) {
      toast({ title: 'Select a student', description: 'Choose a submission to grade.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const payload = {
        studentId: gradeForm.studentId,
        marks: gradeForm.marks ? Number(gradeForm.marks) : null,
        feedback: gradeForm.feedback || null,
      };

      const res = await fetch(`/api/faculty/assignments/${selectedAssignment.id}/submissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to grade submission');
      }

      toast({ title: 'Saved', description: 'Grade updated successfully.' });
      await fetchSubmissions(selectedAssignment.id);
      await fetchAssignments();
    } catch (err) {
      console.error('Grade error:', err);
      toast({ title: 'Save failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const totalSubmissions = assignments.reduce((acc, a) => acc + (a.submission_count ?? 0), 0);
    const totalPending = assignments.reduce((acc, a) => acc + (a.pending_reviews ?? 0), 0);
    const submissionRate = totalAssignments > 0 ? Math.round((totalSubmissions / totalAssignments) * 10) / 10 : 0;

    return {
      totalAssignments,
      totalSubmissions,
      totalPending,
      submissionRate,
    };
  }, [assignments]);

  if (loading || loadingAssignments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'faculty') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/faculty">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Dashboard
              </Button>
            </Link>
            <Link href="/faculty/timetable">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Timetable
              </Button>
            </Link>
            <Link href="/faculty/attendance">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
            </Link>
            <Link href="/faculty/grades">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
              </Button>
            </Link>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Assignments
            </Button>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assignments</h1>
            <p className="text-sm text-muted-foreground mt-1">Create assignments, review submissions, and grade students.</p>
          </div>
          <div className="flex items-center gap-2">
            <Card className="bg-muted p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Pending reviews</p>
                <p className="text-xl font-semibold">{stats.totalPending}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Avg. submissions</p>
                <p className="text-xl font-semibold">{stats.submissionRate}</p>
              </CardContent>
            </Card>
            <Button onClick={openCreateDialog}>New Assignment</Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : null}

        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle className="text-lg">All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
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
                    <TableCell>{assignment.class_name || '—'}</TableCell>
                    <TableCell>{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{assignment.submission_count ?? 0}</TableCell>
                    <TableCell>{assignment.pending_reviews ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => openSubmissionsDialog(assignment)}>
                          Submissions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {assignments.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">No assignments created yet. Use the button above to add one.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setCustomClass('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Class</label>
                {loadingClasses ? (
                  <Input value="Loading classes..." disabled />
                ) : classes.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={form.class_name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prev) => ({ ...prev, class_name: value }));
                        if (value !== '__custom') {
                          setCustomClass('');
                        }
                      }}
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.section}>
                          {cls.department ? `${cls.department} - ${cls.section}` : cls.section}
                        </option>
                      ))}
                      <option value="__custom">Other / custom</option>
                    </select>

                    {form.class_name === '__custom' ? (
                      <Input
                        value={customClass}
                        onChange={(e) => setCustomClass(e.target.value)}
                        placeholder="Custom class name (e.g., CSE-A)"
                      />
                    ) : null}

                    {classesError ? (
                      <p className="text-xs text-destructive">{classesError}</p>
                    ) : null}
                  </div>
                ) : (
                  <Input
                    value={form.class_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, class_name: e.target.value }))}
                    placeholder="Class name (e.g., CSE-A)"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Marks</label>
                  <Input
                    type="number"
                    value={form.total_marks}
                    onChange={(e) => setForm((prev) => ({ ...prev, total_marks: e.target.value }))}
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional details for students"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submissions</DialogTitle>
            </DialogHeader>

            {selectedAssignment ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{selectedAssignment.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedAssignment.subject}</p>
                    {selectedAssignment.deadline ? (
                      <p className="text-xs text-muted-foreground">Deadline: {new Date(selectedAssignment.deadline).toLocaleString()}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  {submissionList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissionList.map((sub) => (
                          <TableRow key={sub.student_id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{sub.student_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(sub.submitted_at).toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {sub.marks == null ? (
                                <Badge variant="outline">Pending</Badge>
                              ) : (
                                <Badge variant="default">Graded</Badge>
                              )}
                            </TableCell>
                            <TableCell>{sub.marks ?? '—'}</TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {sub.feedback || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {sub.file_url ? (
                                  <a
                                    className="text-sm font-medium text-primary hover:underline"
                                    href={sub.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                ) : null}
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setGradeForm({
                                      studentId: sub.student_id,
                                      marks: sub.marks?.toString() || '',
                                      feedback: sub.feedback || '',
                                    });
                                  }}
                                >
                                  Grade
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium">Grade submission</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-sm font-medium">Marks</label>
                      <Input
                        type="number"
                        value={gradeForm.marks}
                        onChange={(e) => setGradeForm((prev) => ({ ...prev, marks: e.target.value }))}
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Feedback</label>
                      <Textarea
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))}
                        rows={3}
                        placeholder="Optional feedback for student"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsSubmissionsOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handleGrade} disabled={isSubmitting || !gradeForm.studentId}>
                    {isSubmitting ? 'Saving…' : 'Save Grade'}
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
