// Shared types and mock data for Principal Portal

export type Status = 'pending' | 'approved' | 'rejected' | 'delegated';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type RiskLevel = 'high' | 'medium' | 'low';

export interface ApprovalItem {
  id: string;
  type: 'academic' | 'student' | 'financial' | 'event' | 'escalated';
  subType: string;
  title: string;
  from: string;
  dept: string;
  priority: Priority;
  date: string;
  status: Status;
  description: string;
  amount?: string;
  hoursAgo: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  roll: string;
  dept: string;
  year: string;
  status: 'active' | 'probation' | 'suspended';
  risk: RiskLevel;
  cgpa: number;
  attendance: number;
  backlogs: number;
  hostel: boolean;
  email: string;
  phone: string;
  flags: string[];
  feesPaid: string;
  feesPending: string;
  scholarships: string;
  recentRequests: { type: string; date: string; status: Status; approvedBy: string }[];
  riskReason: string;
  suggestedAction: string;
}

export interface FacultyRecord {
  id: string;
  name: string;
  facultyId: string;
  dept: string;
  subject: string;
  email: string;
  phone: string;
  qualification: string;
}

// ── All Approval Items (unified inbox) ──────────────────────────────────────

export const allApprovals: ApprovalItem[] = [
  // Academic
  { id: 'AP-001', type: 'academic', subType: 'New Course', title: 'Introduction to Quantum Computing', from: 'HOD — CSE', dept: 'CSE', priority: 'medium', date: '2026-04-14', status: 'pending', description: 'Elective course for 3rd & 4th year. Covers quantum gates, Qiskit.', hoursAgo: 18 },
  { id: 'AP-002', type: 'academic', subType: 'Curriculum Change', title: 'Update DBMS syllabus — add NoSQL', from: 'HOD — CSE', dept: 'CSE', priority: 'low', date: '2026-04-12', status: 'pending', description: 'Add MongoDB and Cassandra modules. Industry demand.', hoursAgo: 60 },
  { id: 'AP-003', type: 'academic', subType: 'Faculty Recruitment', title: 'Assistant Professor — AI/ML', from: 'HOD — CSE', dept: 'CSE', priority: 'high', date: '2026-04-10', status: 'approved', description: '2 faculty for AI/ML elective demand. Ph.D required.', hoursAgo: 120 },
  { id: 'AP-004', type: 'academic', subType: 'Research Project', title: 'Smart Campus IoT Network', from: 'Dr. Mohan Rao', dept: 'ECE', priority: 'medium', date: '2026-04-13', status: 'pending', description: 'IoT sensors for energy monitoring. Budget: Rs.8L.', amount: 'Rs.8,00,000', hoursAgo: 36 },

  // Student requests
  { id: 'AP-005', type: 'student', subType: 'Long Leave', title: 'Medical leave — 15 days', from: 'Rahul Reddy (ECE)', dept: 'ECE', priority: 'high', date: '2026-04-15', status: 'pending', description: 'Spinal surgery recovery. Doctor certificate attached.', hoursAgo: 8 },
  { id: 'AP-006', type: 'student', subType: 'Disciplinary Appeal', title: 'Appeal against suspension', from: 'Ravi Varma (CSE)', dept: 'CSE', priority: 'critical', date: '2026-04-14', status: 'pending', description: 'Appeal against 1-semester suspension. Claims mitigating circumstances.', hoursAgo: 30 },
  { id: 'AP-007', type: 'student', subType: 'Scholarship', title: 'Merit scholarship — college topper', from: 'Swathi Reddy (CSE)', dept: 'CSE', priority: 'medium', date: '2026-04-12', status: 'approved', description: 'GPA 9.7, college topper. Rs.50,000/year.', amount: 'Rs.50,000', hoursAgo: 72 },
  { id: 'AP-008', type: 'student', subType: 'Re-Admission', title: 'Re-admission after dropout', from: 'Sandeep Kumar (MECH)', dept: 'MECH', priority: 'high', date: '2026-04-13', status: 'pending', description: 'Dropped out 3rd year. Family issues resolved. Requests readmission.', hoursAgo: 40 },
  { id: 'AP-009', type: 'student', subType: 'Scholarship', title: 'Sports scholarship — state badminton', from: 'Ananya Das (CSE)', dept: 'CSE', priority: 'medium', date: '2026-04-11', status: 'pending', description: 'State-level badminton champion. Rs.30,000.', amount: 'Rs.30,000', hoursAgo: 55 },

  // Financial
  { id: 'AP-010', type: 'financial', subType: 'Fee Concession', title: 'Full tuition waiver — orphan student', from: 'Dean — Student Affairs', dept: 'CSE', priority: 'critical', date: '2026-04-15', status: 'pending', description: 'Full waiver for orphan student. Background verified.', amount: 'Rs.1,20,000', hoursAgo: 12 },
  { id: 'AP-011', type: 'financial', subType: 'Budget Approval', title: 'CSE Lab Upgrade — GPU Workstations', from: 'HOD — CSE', dept: 'CSE', priority: 'high', date: '2026-04-13', status: 'pending', description: '12 NVIDIA RTX 4090 workstations for AI/ML lab.', amount: 'Rs.18,00,000', hoursAgo: 45 },
  { id: 'AP-012', type: 'financial', subType: 'Infrastructure', title: 'New Seminar Hall — Block C', from: 'Chief Admin Officer', dept: 'Admin', priority: 'high', date: '2026-04-10', status: 'pending', description: '200-seat hall with AV equipment.', amount: 'Rs.45,00,000', hoursAgo: 90 },
  { id: 'AP-013', type: 'financial', subType: 'Fee Concession', title: 'Partial fee waiver — hardship', from: 'Dean — Student Affairs', dept: 'EEE', priority: 'medium', date: '2026-04-14', status: 'approved', description: '50% concession. Family lost income.', amount: 'Rs.60,000', hoursAgo: 24 },

  // Events
  { id: 'AP-014', type: 'event', subType: 'College Fest', title: 'TechnoVista 2026 — Annual Tech Fest', from: 'Student Council', dept: 'All', priority: 'high', date: '2026-04-15', status: 'pending', description: '3-day fest. 20+ events, 15 colleges. Sponsors: TCS, Infosys.', amount: 'Rs.6,00,000', hoursAgo: 10 },
  { id: 'AP-015', type: 'event', subType: 'Inter-College', title: 'Inter-College Cricket Tournament', from: 'Sports Dept', dept: 'All', priority: 'medium', date: '2026-04-14', status: 'pending', description: '8 colleges, 3-day event.', amount: 'Rs.1,50,000', hoursAgo: 28 },
  { id: 'AP-016', type: 'event', subType: 'Guest Lecture', title: 'AI in Healthcare — Stanford Researcher', from: 'CSE Dept', dept: 'CSE', priority: 'low', date: '2026-04-12', status: 'approved', description: 'Guest lecture by Dr. Pranav Rajpurkar.', amount: 'Rs.25,000', hoursAgo: 80 },

  // Escalated
  { id: 'AP-017', type: 'escalated', subType: 'HOD Complaint', title: 'Faculty harassment complaint — CSE', from: 'HOD — CSE', dept: 'CSE', priority: 'critical', date: '2026-04-15', status: 'pending', description: 'Student filed harassment complaint. HOD recommends inquiry committee.', hoursAgo: 6 },
  { id: 'AP-018', type: 'escalated', subType: 'Rule Override', title: 'Late fee payment — 35 students', from: 'Finance Dept', dept: 'All', priority: 'critical', date: '2026-04-14', status: 'pending', description: 'Drought-affected students requesting 60-day extension.', hoursAgo: 52 },
  { id: 'AP-019', type: 'escalated', subType: 'Emergency', title: 'Campus flooding — Block D damage', from: 'Admin Office', dept: 'Admin', priority: 'critical', date: '2026-04-13', status: 'approved', description: 'Lab damage. Repair estimate: Rs.12L.', amount: 'Rs.12,00,000', hoursAgo: 65 },
  { id: 'AP-020', type: 'escalated', subType: 'Conflict', title: 'Faculty transfer dispute — ECE/EEE', from: 'HOD — ECE', dept: 'ECE', priority: 'high', date: '2026-04-12', status: 'pending', description: 'Faculty objects to involuntary transfer. Both HODs disagree.', hoursAgo: 75 },
];

// ── Student Records ─────────────────────────────────────────────────────────

export const studentRecords: StudentRecord[] = [
  {
    id: '1', name: 'Anil Kumar', roll: '23R21A0501', dept: 'CSE', year: '2nd', status: 'active', risk: 'low',
    cgpa: 8.5, attendance: 92, backlogs: 0, hostel: true, email: 'anil@mlrit.ac.in', phone: '9876543210',
    flags: [], feesPaid: 'Rs.1,20,000', feesPending: 'Rs.0', scholarships: 'None',
    recentRequests: [{ type: 'Hostel Leave', date: '2026-04-10', status: 'approved', approvedBy: 'Warden' }],
    riskReason: 'All metrics normal', suggestedAction: 'No action needed',
  },
  {
    id: '2', name: 'Priya Sharma', roll: '23R21A0502', dept: 'CSE', year: '2nd', status: 'active', risk: 'medium',
    cgpa: 7.8, attendance: 68, backlogs: 1, hostel: true, email: 'priya@mlrit.ac.in', phone: '9876543211',
    flags: ['Low Attendance (<75%)', 'Backlog: 1 subject'], feesPaid: 'Rs.1,00,000', feesPending: 'Rs.20,000', scholarships: 'None',
    recentRequests: [
      { type: 'Attendance Appeal', date: '2026-04-12', status: 'pending', approvedBy: '—' },
      { type: 'Fee Extension', date: '2026-04-08', status: 'approved', approvedBy: 'Accounts' },
    ],
    riskReason: 'Attendance 68% + 1 backlog + fee pending', suggestedAction: 'Review attendance, notify parent',
  },
  {
    id: '3', name: 'Rahul Reddy', roll: '23R21A1201', dept: 'ECE', year: '2nd', status: 'active', risk: 'high',
    cgpa: 6.2, attendance: 55, backlogs: 3, hostel: false, email: 'rahul@mlrit.ac.in', phone: '9876543212',
    flags: ['Low Attendance (<75%)', 'Backlogs: 3 subjects', 'Frequent Leave Requests', 'Low CGPA'],
    feesPaid: 'Rs.80,000', feesPending: 'Rs.40,000', scholarships: 'None',
    recentRequests: [
      { type: 'Long Leave (15d)', date: '2026-04-14', status: 'pending', approvedBy: '—' },
      { type: 'Grade Review', date: '2026-04-05', status: 'rejected', approvedBy: 'HOD' },
      { type: 'Leave Request', date: '2026-03-20', status: 'approved', approvedBy: 'Faculty' },
      { type: 'Leave Request', date: '2026-03-05', status: 'approved', approvedBy: 'Faculty' },
    ],
    riskReason: '55% attendance + 3 backlogs + frequent leaves + fee pending Rs.40k', suggestedAction: 'Immediate counseling, parent meeting required',
  },
  {
    id: '4', name: 'Sneha Patil', roll: '22R21A0401', dept: 'EEE', year: '3rd', status: 'active', risk: 'low',
    cgpa: 8.9, attendance: 89, backlogs: 0, hostel: true, email: 'sneha@mlrit.ac.in', phone: '9876543213',
    flags: [], feesPaid: 'Rs.1,20,000', feesPending: 'Rs.0', scholarships: 'Merit — Rs.20,000',
    recentRequests: [{ type: 'Room Change', date: '2026-04-08', status: 'approved', approvedBy: 'Hostel Head' }],
    riskReason: 'All metrics normal', suggestedAction: 'No action needed',
  },
  {
    id: '5', name: 'Ravi Varma', roll: '22R21A0505', dept: 'CSE', year: '3rd', status: 'probation', risk: 'high',
    cgpa: 5.8, attendance: 62, backlogs: 4, hostel: true, email: 'ravi@mlrit.ac.in', phone: '9876543220',
    flags: ['Low Attendance (<75%)', 'Backlogs: 4 subjects', 'Disciplinary Record', 'On Probation'],
    feesPaid: 'Rs.1,20,000', feesPending: 'Rs.0', scholarships: 'None',
    recentRequests: [
      { type: 'Disciplinary Appeal', date: '2026-04-14', status: 'pending', approvedBy: '—' },
      { type: 'Attendance Appeal', date: '2026-03-15', status: 'rejected', approvedBy: 'HOD' },
    ],
    riskReason: 'Probation + 4 backlogs + disciplinary record + 62% attendance', suggestedAction: 'Review appeal, consider conditions for continuation',
  },
  {
    id: '6', name: 'Swathi Reddy', roll: '21R21A0504', dept: 'CSE', year: '4th', status: 'active', risk: 'low',
    cgpa: 9.7, attendance: 96, backlogs: 0, hostel: false, email: 'swathi@mlrit.ac.in', phone: '9876543221',
    flags: [], feesPaid: 'Rs.1,20,000', feesPending: 'Rs.0', scholarships: 'Merit — Rs.50,000',
    recentRequests: [{ type: 'Scholarship', date: '2026-04-12', status: 'approved', approvedBy: 'Principal' }],
    riskReason: 'College topper, excellent record', suggestedAction: 'No action needed',
  },
  {
    id: '7', name: 'Vikram Singh', roll: '22R21A0301', dept: 'MECH', year: '3rd', status: 'active', risk: 'medium',
    cgpa: 7.1, attendance: 72, backlogs: 2, hostel: true, email: 'vikram@mlrit.ac.in', phone: '9876543214',
    flags: ['Low Attendance (<75%)', 'Backlogs: 2 subjects'], feesPaid: 'Rs.1,10,000', feesPending: 'Rs.10,000', scholarships: 'None',
    recentRequests: [{ type: 'Room Change', date: '2026-04-05', status: 'rejected', approvedBy: 'Hostel Head' }],
    riskReason: '72% attendance + 2 backlogs', suggestedAction: 'Monitor, warn if attendance drops further',
  },
  {
    id: '8', name: 'Ananya Das', roll: '24R21A0503', dept: 'CSE', year: '1st', status: 'active', risk: 'low',
    cgpa: 9.5, attendance: 95, backlogs: 0, hostel: true, email: 'ananya@mlrit.ac.in', phone: '9876543215',
    flags: [], feesPaid: 'Rs.1,20,000', feesPending: 'Rs.0', scholarships: 'Sports — Rs.30,000 (pending)',
    recentRequests: [{ type: 'Scholarship', date: '2026-04-11', status: 'pending', approvedBy: '—' }],
    riskReason: 'Excellent record', suggestedAction: 'No action needed',
  },
  {
    id: '9', name: 'Karthik Nair', roll: '23R21A6601', dept: 'IT', year: '2nd', status: 'active', risk: 'medium',
    cgpa: 6.8, attendance: 61, backlogs: 2, hostel: false, email: 'karthik@mlrit.ac.in', phone: '9876543216',
    flags: ['Low Attendance (<75%)', 'Backlogs: 2 subjects', 'Fee Pending'], feesPaid: 'Rs.90,000', feesPending: 'Rs.30,000', scholarships: 'None',
    recentRequests: [
      { type: 'Fee Extension', date: '2026-04-10', status: 'pending', approvedBy: '—' },
      { type: 'Leave Request', date: '2026-03-25', status: 'approved', approvedBy: 'Faculty' },
    ],
    riskReason: '61% attendance + 2 backlogs + fee pending Rs.30k', suggestedAction: 'Fee reminder + attendance warning',
  },
  {
    id: '10', name: 'Sandeep Kumar', roll: '21R21A0320', dept: 'MECH', year: '3rd', status: 'suspended', risk: 'high',
    cgpa: 5.2, attendance: 0, backlogs: 6, hostel: false, email: 'sandeep@mlrit.ac.in', phone: '9876543222',
    flags: ['Suspended', 'Re-Admission Request', 'Backlogs: 6 subjects'], feesPaid: 'Rs.0', feesPending: 'Rs.1,20,000', scholarships: 'None',
    recentRequests: [{ type: 'Re-Admission', date: '2026-04-13', status: 'pending', approvedBy: '—' }],
    riskReason: 'Suspended, 6 backlogs, full fee pending, readmission request', suggestedAction: 'Review readmission case thoroughly',
  },
];

// ── Faculty Records ─────────────────────────────────────────────────────────

export const facultyRecords: FacultyRecord[] = [
  { id: '1', name: 'Dr. Rao Venkat', facultyId: 'F01', dept: 'CSE', subject: 'Artificial Intelligence', email: 'rao@mlrit.ac.in', phone: '9871234560', qualification: 'Ph.D (CSE)' },
  { id: '2', name: 'Dr. Sunita Devi', facultyId: 'F02', dept: 'CSE', subject: 'Data Structures', email: 'sunita@mlrit.ac.in', phone: '9871234561', qualification: 'Ph.D (CSE)' },
  { id: '3', name: 'Prof. Ramesh Babu', facultyId: 'F03', dept: 'ECE', subject: 'VLSI Design', email: 'ramesh@mlrit.ac.in', phone: '9871234562', qualification: 'M.Tech (ECE)' },
  { id: '4', name: 'Dr. Lakshmi Prasad', facultyId: 'F04', dept: 'EEE', subject: 'Power Systems', email: 'lakshmi@mlrit.ac.in', phone: '9871234563', qualification: 'Ph.D (EEE)' },
  { id: '5', name: 'Prof. Arun Kumar', facultyId: 'F05', dept: 'MECH', subject: 'Thermodynamics', email: 'arun@mlrit.ac.in', phone: '9871234564', qualification: 'M.Tech (MECH)' },
  { id: '6', name: 'Dr. Kavitha Reddy', facultyId: 'F06', dept: 'CSE', subject: 'Machine Learning', email: 'kavitha@mlrit.ac.in', phone: '9871234565', qualification: 'Ph.D (CSE)' },
  { id: '7', name: 'Prof. Suresh Yadav', facultyId: 'F07', dept: 'IT', subject: 'Web Technologies', email: 'suresh@mlrit.ac.in', phone: '9871234566', qualification: 'M.Tech (IT)' },
  { id: '8', name: 'Dr. Bhavani Shankar', facultyId: 'F08', dept: 'CIVIL', subject: 'Structural Analysis', email: 'bhavani@mlrit.ac.in', phone: '9871234567', qualification: 'Ph.D (CIVIL)' },
  { id: '9', name: 'Prof. Neha Gupta', facultyId: 'F09', dept: 'AIDS', subject: 'Deep Learning', email: 'neha@mlrit.ac.in', phone: '9871234568', qualification: 'M.Tech (CSE)' },
  { id: '10', name: 'Dr. Mohan Rao', facultyId: 'F10', dept: 'ECE', subject: 'Signal Processing', email: 'mohan@mlrit.ac.in', phone: '9871234569', qualification: 'Ph.D (ECE)' },
];

// ── Helper constants ────────────────────────────────────────────────────────

export const DEPARTMENTS = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'Admin'];
export const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
export const TYPE_LABELS: Record<string, string> = {
  academic: 'Academic', student: 'Student', financial: 'Financial', event: 'Event', escalated: 'Escalated',
};
