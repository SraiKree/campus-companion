export type UserRole = 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
