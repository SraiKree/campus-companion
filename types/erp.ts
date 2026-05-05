export type UserRole = 'student' | 'faculty' | 'principal' | 'management' | 'hostel' | 'hod' | 'club' | 'admin' | 'transport' | 'library' | 'hr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roll_no?: string; // For students
  class_name?: string; // For students
  department?: string; // For both students and faculty
  isHosteller?: boolean; // Students only
  hostelStatus?: 'active' | 'left'; // Students only
}

export interface AttendanceRecord {
  subject: string;
  subjectCode: string;
  totalClasses: number;
  attended: number;
  percentage: number;
}

export interface LeaveRequest {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  marks?: number;
  totalMarks: number;
  fileUrl?: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
}

export interface StudentAttendanceRecord {
  id: string;
  name: string;
  rollNo: string;
  present: boolean;
}

export interface AssignmentSubmission {
  id: string;
  studentName: string;
  rollNo: string;
  submittedAt: string;
  fileUrl: string;
  marks?: number;
  feedback?: string;
}

export interface Grade {
  id: string;
  subject: string;
  subjectCode: string;
  semester: number;
  term: string;
  marks: number;
  totalMarks: number;
  grade: string;
  gradePoints: number;
  credits: number;
}

export interface SubjectGrade {
  subject: string;
  subjectCode: string;
  semester: number;
  term: string;
  assignments: {
    id: string;
    title: string;
    marks: number;
    totalMarks: number;
    percentage: number;
  }[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  gradePoints: number;
  credits: number;
}

export interface SemesterGrades {
  semester: number;
  term: string;
  subjects: SubjectGrade[];
  gpa: number;
  totalCredits: number;
}

export interface GradeStats {
  cgpa: number;
  totalCredits: number;
  semesters: SemesterGrades[];
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
}
