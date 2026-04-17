export const DEPT = 'CSE';

export type Status = 'pending' | 'approved' | 'rejected';
export type Priority = 'high' | 'medium' | 'low';

export interface DeptStudent {
  name: string; roll: string; year: string; section: string;
  attendance: number; gpa: number; backlogs: number; email: string; phone: string;
  status: 'active' | 'probation' | 'detained';
  flags: string[];
}

export interface DeptFaculty {
  name: string; facultyId: string; subject: string;
  classesTaken: number; totalClasses: number; email: string; phone: string;
  qualification: string; rating: number;
}

export interface ApprovalReq {
  id: string; type: 'leave' | 'grade_review' | 'course_approval' | 'attendance_appeal' | 'project_extension' | 'faculty_leave';
  from: string; roll?: string; priority: Priority;
  subject: string; description: string; date: string; status: Status;
}

export interface AttendanceRecord {
  subject: string; subjectCode: string; faculty: string;
  totalClasses: number; avgAttendance: number;
  below75: number; below60: number;
}

export const students: DeptStudent[] = [
  { name: 'Anil Kumar', roll: '23R21A0501', year: '2nd', section: 'A', attendance: 92, gpa: 9.1, backlogs: 0, email: 'anil@mlrit.ac.in', phone: '9876543210', status: 'active', flags: [] },
  { name: 'Priya Sharma', roll: '23R21A0502', year: '2nd', section: 'A', attendance: 68, gpa: 7.8, backlogs: 1, email: 'priya@mlrit.ac.in', phone: '9876543211', status: 'active', flags: ['Low Attendance', 'Backlog'] },
  { name: 'Ananya Das', roll: '24R21A0503', year: '1st', section: 'A', attendance: 95, gpa: 9.5, backlogs: 0, email: 'ananya@mlrit.ac.in', phone: '9876543215', status: 'active', flags: [] },
  { name: 'Suresh Babu', roll: '21R21A0101', year: '4th', section: 'B', attendance: 78, gpa: 8.0, backlogs: 0, email: 'suresh@mlrit.ac.in', phone: '9876543218', status: 'active', flags: [] },
  { name: 'Swathi Reddy', roll: '21R21A0504', year: '4th', section: 'A', attendance: 96, gpa: 9.7, backlogs: 0, email: 'swathi@mlrit.ac.in', phone: '9876543221', status: 'active', flags: [] },
  { name: 'Ravi Varma', roll: '22R21A0505', year: '3rd', section: 'B', attendance: 62, gpa: 6.4, backlogs: 3, email: 'ravi@mlrit.ac.in', phone: '9876543220', status: 'probation', flags: ['Low Attendance', 'Backlogs: 3', 'Probation'] },
  { name: 'Neelam Jain', roll: '24R21A0506', year: '1st', section: 'B', attendance: 88, gpa: 8.6, backlogs: 0, email: 'neelam@mlrit.ac.in', phone: '9876543222', status: 'active', flags: [] },
  { name: 'Kiran Reddy', roll: '22R21A0507', year: '3rd', section: 'A', attendance: 71, gpa: 7.2, backlogs: 2, email: 'kiran@mlrit.ac.in', phone: '9876543223', status: 'active', flags: ['Low Attendance', 'Backlogs: 2'] },
  { name: 'Deepak Rao', roll: '23R21A0508', year: '2nd', section: 'B', attendance: 58, gpa: 5.9, backlogs: 4, email: 'deepak@mlrit.ac.in', phone: '9876543224', status: 'probation', flags: ['Low Attendance', 'Backlogs: 4', 'Probation'] },
  { name: 'Megha Suri', roll: '24R21A0509', year: '1st', section: 'A', attendance: 90, gpa: 8.8, backlogs: 0, email: 'megha@mlrit.ac.in', phone: '9876543225', status: 'active', flags: [] },
  { name: 'Arjun Prasad', roll: '22R21A0510', year: '3rd', section: 'B', attendance: 45, gpa: 5.2, backlogs: 5, email: 'arjun@mlrit.ac.in', phone: '9876543226', status: 'detained', flags: ['Detained', 'Backlogs: 5', 'Attendance < 50%'] },
  { name: 'Pooja Reddy', roll: '21R21A0511', year: '4th', section: 'A', attendance: 85, gpa: 8.3, backlogs: 0, email: 'pooja@mlrit.ac.in', phone: '9876543227', status: 'active', flags: [] },
];

export const faculty: DeptFaculty[] = [
  { name: 'Dr. Rao Venkat', facultyId: 'F01', subject: 'Artificial Intelligence', classesTaken: 142, totalClasses: 150, email: 'rao@mlrit.ac.in', phone: '9871234560', qualification: 'Ph.D (CSE)', rating: 4.8 },
  { name: 'Dr. Sunita Devi', facultyId: 'F02', subject: 'Data Structures', classesTaken: 138, totalClasses: 150, email: 'sunita@mlrit.ac.in', phone: '9871234561', qualification: 'Ph.D (CSE)', rating: 4.5 },
  { name: 'Dr. Kavitha Reddy', facultyId: 'F06', subject: 'Machine Learning', classesTaken: 145, totalClasses: 150, email: 'kavitha@mlrit.ac.in', phone: '9871234565', qualification: 'Ph.D (CSE)', rating: 4.9 },
  { name: 'Prof. Arjun Rao', facultyId: 'F11', subject: 'DBMS', classesTaken: 120, totalClasses: 150, email: 'arjun@mlrit.ac.in', phone: '9871234570', qualification: 'M.Tech (CSE)', rating: 4.1 },
  { name: 'Prof. Meghana Sri', facultyId: 'F12', subject: 'Operating Systems', classesTaken: 115, totalClasses: 150, email: 'meghana@mlrit.ac.in', phone: '9871234571', qualification: 'M.Tech (CSE)', rating: 3.8 },
  { name: 'Dr. Ramana Kumar', facultyId: 'F13', subject: 'Computer Networks', classesTaken: 140, totalClasses: 150, email: 'ramana@mlrit.ac.in', phone: '9871234572', qualification: 'Ph.D (CSE)', rating: 4.3 },
];

export const approvals: ApprovalReq[] = [
  { id: 'HOD-001', type: 'leave', from: 'Priya Sharma', roll: '23R21A0502', priority: 'medium', subject: 'Family function — 3 days', description: 'Leave from 18-20 April for family function. Parent consent attached.', date: '2026-04-15', status: 'pending' },
  { id: 'HOD-002', type: 'grade_review', from: 'Kiran Reddy', roll: '22R21A0507', priority: 'high', subject: 'DBMS Mid-2 revaluation', description: 'Expected 30+ but scored 18. Requesting paper recheck.', date: '2026-04-14', status: 'pending' },
  { id: 'HOD-003', type: 'attendance_appeal', from: 'Ravi Varma', roll: '22R21A0505', priority: 'high', subject: 'Medical attendance exemption', description: 'Was hospitalized 2 weeks. Requesting attendance exemption for that period. Docs attached.', date: '2026-04-13', status: 'pending' },
  { id: 'HOD-004', type: 'course_approval', from: 'Dr. Rao Venkat', priority: 'medium', subject: 'New elective: Quantum Computing', description: 'Proposing new elective for 3rd/4th year. Syllabus and resources prepared.', date: '2026-04-12', status: 'pending' },
  { id: 'HOD-005', type: 'project_extension', from: 'Suresh Babu', roll: '21R21A0101', priority: 'low', subject: 'Final year project extension — 2 weeks', description: 'Hardware components delayed. Need 2-week extension for IoT project.', date: '2026-04-11', status: 'approved' },
  { id: 'HOD-006', type: 'faculty_leave', from: 'Dr. Sunita Devi', priority: 'medium', subject: 'Conference leave — 2 days', description: 'Attending IEEE conference on data science. Paper accepted.', date: '2026-04-14', status: 'pending' },
  { id: 'HOD-007', type: 'leave', from: 'Deepak Rao', roll: '23R21A0508', priority: 'low', subject: 'Personal leave — 1 day', description: 'Passport appointment on 19th April.', date: '2026-04-16', status: 'pending' },
  { id: 'HOD-008', type: 'grade_review', from: 'Ananya Das', roll: '24R21A0503', priority: 'low', subject: 'Physics lab internal marks review', description: 'Lab report was submitted on time but marked absent. Requesting correction.', date: '2026-04-10', status: 'approved' },
  { id: 'HOD-009', type: 'attendance_appeal', from: 'Deepak Rao', roll: '23R21A0508', priority: 'high', subject: 'Attendance shortage — semester bar appeal', description: 'Attendance 58%. Requesting permission to attend exams. Promises improvement.', date: '2026-04-16', status: 'pending' },
  { id: 'HOD-010', type: 'course_approval', from: 'Dr. Kavitha Reddy', priority: 'medium', subject: 'Update ML syllabus — add LLMs module', description: 'Add large language models and prompt engineering to existing ML course.', date: '2026-04-08', status: 'approved' },
];

export const attendanceRecords: AttendanceRecord[] = [
  { subject: 'Artificial Intelligence', subjectCode: 'CS601', faculty: 'Dr. Rao Venkat', totalClasses: 48, avgAttendance: 82, below75: 3, below60: 1 },
  { subject: 'Data Structures', subjectCode: 'CS301', faculty: 'Dr. Sunita Devi', totalClasses: 52, avgAttendance: 78, below75: 5, below60: 2 },
  { subject: 'Machine Learning', subjectCode: 'CS602', faculty: 'Dr. Kavitha Reddy', totalClasses: 46, avgAttendance: 85, below75: 2, below60: 0 },
  { subject: 'DBMS', subjectCode: 'CS401', faculty: 'Prof. Arjun Rao', totalClasses: 50, avgAttendance: 74, below75: 7, below60: 3 },
  { subject: 'Operating Systems', subjectCode: 'CS402', faculty: 'Prof. Meghana Sri', totalClasses: 48, avgAttendance: 72, below75: 8, below60: 4 },
  { subject: 'Computer Networks', subjectCode: 'CS501', faculty: 'Dr. Ramana Kumar', totalClasses: 44, avgAttendance: 80, below75: 4, below60: 1 },
];

export const TYPE_LABELS: Record<string, string> = {
  leave: 'Student Leave', grade_review: 'Grade Review', course_approval: 'Course Approval',
  attendance_appeal: 'Attendance Appeal', project_extension: 'Project Extension', faculty_leave: 'Faculty Leave',
};
