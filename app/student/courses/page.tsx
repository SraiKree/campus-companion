'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useStudentGrades } from '@/hooks/useStudentGrades';
import CourseDiscussion from '@/components/CourseDiscussion';
import { 
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Download,
  Search,
  Bell,
  Settings
} from 'lucide-react';

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

interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  department?: string;
  section?: string;
  semester?: string;
  academicYear?: string;
  room?: string;
  isLab?: boolean;
}

interface StudentInfo {
  department: string;
  section: string;
  semester: string;
  year: string;
}

const GRADE_COLORS = {
  'A+': '#10b981',
  'A': '#059669',
  'B+': '#3b82f6',
  'B': '#2563eb',
  'C+': '#f59e0b',
  'C': '#d97706',
  'D': '#ef4444',
  'F': '#dc2626',
};

// Radial progress component
const RadialProgress = ({ progress, color }: { progress: number; color: string }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#e5e5e5"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#1a1a1a]">{progress}%</span>
      </div>
    </div>
  );
};

export default function StudentCoursesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>('unit-2');

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grades state
  const { loading: loadingGrades, gradeStats, selectedSemester } = useStudentGrades();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'student') {
      fetchCourses();
      fetchAssignments();
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/student/courses', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await res.json();
      setCourses(data.courses || []);
      setStudentInfo(data.studentInfo || null);
      
      // Set first course as selected
      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
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
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedAssignment || !selectedFile) {
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

  if (authLoading || loadingCourses || loadingAssignments || loadingGrades) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c44545] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading courses...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  const currentSemester = gradeStats?.semesters.find(s => s.semester === selectedSemester);

  return (
    <StudentLayout>
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Course Sidebar */}
        <div className="w-80 bg-white rounded-2xl border border-[#e5e5e5] p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">Active Enrolment</h2>
              {studentInfo && (
                <Badge className="bg-[#f2f0ed] text-[#666] text-[10px] font-bold border-0">
                  {studentInfo.department} {studentInfo.section}
                </Badge>
              )}
            </div>
            {studentInfo && (
              <p className="text-xs text-[#666]">
                Semester {studentInfo.semester} • Year {studentInfo.year}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#666]">No courses found</p>
                <p className="text-xs text-[#666] mt-2">Courses will appear based on your department and section</p>
              </div>
            ) : (
              courses.map((course) => {
                // Calculate progress based on assignments (set to 0% for now)
                const progress = 0;
                const color = 'var(--ch-accent)';
                
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedCourse?.id === course.id
                        ? 'border-[#c44545] bg-[#c44545]/5'
                        : 'border-[#e5e5e5] hover:border-[#c44545]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">
                          {course.code}
                        </p>
                        <h3 className="text-sm font-bold text-[#1a1a1a] leading-tight mb-1">
                          {course.name}
                        </h3>
                        <p className="text-xs text-[#666]">{course.instructor}</p>
                      </div>
                      <RadialProgress progress={progress} color={color} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-[#e5e5e5] p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#1a1a1a]">Courses</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                  <input
                    type="text"
                    placeholder="Search syllabus..."
                    className="pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#c44545]"
                  />
                </div>
                <button className="p-2 hover:bg-[#f2f0ed] rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-[#666]" />
                </button>
                <button className="p-2 hover:bg-[#f2f0ed] rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-[#666]" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {['assignments', 'syllabus', 'discussions', 'grades'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-[#c44545] text-white shadow-md'
                      : 'text-[#666] hover:bg-[#f2f0ed]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                {selectedCourse ? (
                  <>
                    {/* Assignment Header */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                            {selectedCourse.name}
                          </h2>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-[#666]">
                              <span className="font-medium">{selectedCourse.code}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#666]">
                              <span>Instructor: {selectedCourse.instructor}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Assignments List */}
                      <div className="space-y-3">
                        {assignments.filter(a => a.subject === selectedCourse.name).length === 0 ? (
                          <div className="text-center py-12 bg-[#f2f0ed] rounded-xl">
                            <FileText className="w-12 h-12 text-[#666] mx-auto mb-3" />
                            <p className="text-[#666]">No assignments for this course yet</p>
                          </div>
                        ) : (
                          assignments
                            .filter(a => a.subject === selectedCourse.name)
                            .map((assignment) => (
                              <div key={assignment.id} className="border border-[#e5e5e5] rounded-xl overflow-hidden">
                                <button
                                  onClick={() => setExpandedUnit(expandedUnit === assignment.id ? null : assignment.id)}
                                  className="w-full flex items-center justify-between p-4 hover:bg-[#f2f0ed] transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedUnit === assignment.id ? (
                                      <ChevronDown className="w-5 h-5 text-[#666]" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-[#666]" />
                                    )}
                                    <span className="font-medium text-[#1a1a1a]">{assignment.title}</span>
                                  </div>
                                  <Badge className={
                                    assignment.status === 'graded' 
                                      ? 'bg-emerald-500/10 text-emerald-600 border-0 font-bold'
                                      : assignment.status === 'submitted'
                                      ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-0 font-bold'
                                      : 'bg-[#c44545]/10 text-[#c44545] border-0 font-bold'
                                  }>
                                    {assignment.status?.toUpperCase() || 'PENDING'}
                                  </Badge>
                                </button>
                                {expandedUnit === assignment.id && (
                                  <div className="p-4 border-t border-[#e5e5e5] bg-white">
                                    <p className="text-sm text-[#666] leading-relaxed mb-4">
                                      {assignment.description || 'No description provided'}
                                    </p>
                                    {assignment.deadline && (
                                      <div className="flex items-center gap-2 text-sm text-[#666] mb-4">
                                        <Clock className="w-4 h-4" />
                                        <span>Due: {new Date(assignment.deadline).toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      {assignment.file_url && (
                                        <a
                                          href={assignment.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2 border border-[#e5e5e5] text-[#666] rounded-lg text-sm font-medium hover:bg-[#f2f0ed] transition-colors"
                                        >
                                          <Download className="w-4 h-4" />
                                          View Submission
                                        </a>
                                      )}
                                      {assignment.status !== 'graded' && (
                                        <Button
                                          onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setOpenDialog(true);
                                          }}
                                          className="bg-[#c44545] hover:bg-[#c44545]/90 text-white rounded-lg"
                                        >
                                          {assignment.status === 'pending' ? 'Submit' : 'Resubmit'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 text-[#666] mx-auto mb-4" />
                    <p className="text-[#666]">Select a course to view assignments</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'syllabus' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-[#666] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Syllabus</h3>
                  <p className="text-[#666]">Coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              selectedCourse ? (
                <CourseDiscussion
                  key={selectedCourse.id}
                  subjectCode={selectedCourse.code}
                  subjectName={selectedCourse.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-[#666] mx-auto mb-4" />
                    <p className="text-[#666]">Select a course to open its discussion</p>
                  </div>
                </div>
              )
            )}

            {activeTab === 'grades' && (
              <div className="space-y-6">
                {!gradeStats || gradeStats.semesters.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-[#666] mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No Grades Available</h3>
                      <p className="text-[#666]">Your grades will appear here once assignments are graded</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#f2f0ed] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">CGPA</p>
                        <p className="text-3xl font-bold text-[#1a1a1a]">{gradeStats.cgpa}</p>
                      </div>
                      <div className="bg-[#f2f0ed] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Total Credits</p>
                        <p className="text-3xl font-bold text-[#1a1a1a]">{gradeStats.totalCredits}</p>
                      </div>
                      <div className="bg-[#f2f0ed] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Semesters</p>
                        <p className="text-3xl font-bold text-[#1a1a1a]">{gradeStats.semesters.length}</p>
                      </div>
                      <div className="bg-[#f2f0ed] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2">Current GPA</p>
                        <p className="text-3xl font-bold text-[#1a1a1a]">{currentSemester?.gpa || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Subject Grades */}
                    {currentSemester && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#1a1a1a]">
                          {currentSemester.term} - Subject Grades
                        </h3>
                        {currentSemester.subjects.map((subject) => (
                          <div key={subject.subject} className="border border-[#e5e5e5] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-[#1a1a1a]">{subject.subject}</h4>
                                <p className="text-sm text-[#666]">{subject.subjectCode} • {subject.credits} credits</p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  className="text-lg px-3 py-1 border-0"
                                  style={{ 
                                    backgroundColor: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS] + '20',
                                    color: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS]
                                  }}
                                >
                                  {subject.grade}
                                </Badge>
                                <p className="text-sm text-[#666] mt-1">{subject.percentage}%</p>
                              </div>
                            </div>
                            <Progress value={subject.percentage} className="mb-2" />
                            <p className="text-sm text-[#666]">
                              {subject.obtainedMarks} / {subject.totalMarks} marks • {subject.assignments.length} assignments
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Submission Dialog */}
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
              className="bg-[#c44545] hover:bg-[#c44545]/90 text-white"
            >
              {isSubmitting ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
