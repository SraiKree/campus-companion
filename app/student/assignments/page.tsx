'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { FileText, Filter } from 'lucide-react';

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
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Graded</Badge>;
      case 'submitted':
        return <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20">Submitted</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20">Pending</Badge>;
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
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading assignments...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Assignments</h1>
            <p className="text-[#666]">View and submit assignments for your classes</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#666]" />
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-40 border-[#e5e5e5] rounded-xl">
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

            <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val)}>
              <SelectTrigger className="w-44 border-[#e5e5e5] rounded-xl">
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

        {error && (
          <div className="rounded-xl border border-[#e05252]/20 bg-[#e05252]/5 p-6">
            <p className="text-sm text-[#e05252]">{error}</p>
          </div>
        )}

        {filteredAssignments.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-[#666] mx-auto mb-4" />
            <p className="text-[#666]">No assignments found for the selected filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
            <div className="p-6 border-b border-[#e5e5e5]">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Your Assignments</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e5e5e5] hover:bg-transparent">
                    <TableHead className="text-[#666] font-bold text-xs uppercase">Title</TableHead>
                    <TableHead className="text-[#666] font-bold text-xs uppercase">Subject</TableHead>
                    <TableHead className="text-[#666] font-bold text-xs uppercase">Deadline</TableHead>
                    <TableHead className="text-[#666] font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="text-[#666] font-bold text-xs uppercase">Grade</TableHead>
                    <TableHead className="text-right text-[#666] font-bold text-xs uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} className="border-[#e5e5e5]">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[#1a1a1a]">{assignment.title}</span>
                          {assignment.description && (
                            <span className="text-xs text-[#666] line-clamp-2">
                              {assignment.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#666]">{assignment.subject}</TableCell>
                      <TableCell className="text-[#666]">
                        {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>
                        {assignment.status === 'graded' ? (
                          <span className="font-bold text-[#1a1a1a]">{assignment.marks ?? '—'}</span>
                        ) : (
                          <span className="text-[#666]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {assignment.file_url && (
                            <a
                              className="text-sm font-medium text-[#e05252] hover:underline"
                              href={assignment.file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          )}
                          <Button
                            size="sm"
                            disabled={assignment.status === 'graded' || isSubmitting}
                            onClick={() => openSubmissionDialog(assignment)}
                            className="bg-[#e05252] hover:bg-[#e05252]/90 text-white rounded-lg"
                          >
                            {assignment.status === 'pending' ? 'Submit' : 'Resubmit'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-[#e5e5e5]">
              <p className="text-xs text-[#666]">
                Grades and feedback will appear once your instructor reviews the submission
              </p>
            </div>
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="border-[#e5e5e5]">
            <DialogHeader>
              <DialogTitle className="text-[#1a1a1a]">Submit Assignment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedAssignment && (
                <div className="space-y-1 p-4 bg-[#f2f0ed] rounded-xl">
                  <p className="text-sm font-bold text-[#1a1a1a]">{selectedAssignment.title}</p>
                  <p className="text-sm text-[#666]">{selectedAssignment.subject}</p>
                  {selectedAssignment.deadline && (
                    <p className="text-sm text-[#666]">
                      Deadline: {new Date(selectedAssignment.deadline).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-[#1a1a1a]">Choose file</label>
                <input
                  type="file"
                  className="mt-2 w-full text-sm text-[#666]"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-[#666] mt-1">Allowed: PDF, DOCX, ZIP (max 15MB)</p>
              </div>

              {selectedFile && (
                <div className="rounded-xl border border-[#e5e5e5] bg-[#f2f0ed] p-3">
                  <p className="text-sm font-medium text-[#1a1a1a]">{selectedFile.name}</p>
                  <p className="text-xs text-[#666]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={() => setOpenDialog(false)}
                className="hover:bg-[#f2f0ed]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isSubmitting || !selectedFile}
                className="bg-[#e05252] hover:bg-[#e05252]/90 text-white"
              >
                {isSubmitting ? 'Uploading…' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
