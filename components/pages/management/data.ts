export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'overdue';

export interface Department {
  name: string; code: string; hod: string; faculty: number; students: number;
  budget: string; spent: string; utilization: number; avgAttendance: number; passRate: number;
}

export interface StaffMember {
  id: string; name: string; dept: string; role: 'faculty' | 'non-teaching';
  designation: string; email: string; phone: string; joinDate: string;
  status: 'active' | 'on_leave' | 'resigned';
}

export interface FeeRecord {
  dept: string; totalStudents: number; collected: number; pending: number;
  collectedAmt: string; pendingAmt: string; rate: number;
}

export interface ExpenseItem {
  id: string; category: string; description: string; dept: string;
  amount: string; date: string; status: Status; approvedBy: string;
}

export interface Asset {
  id: string; name: string; location: string; category: 'building' | 'lab' | 'equipment' | 'vehicle';
  condition: 'good' | 'fair' | 'poor'; value: string; lastMaintenance: string;
}

export const departments: Department[] = [
  { name: 'Computer Science & Engineering', code: 'CSE', hod: 'Dr. Rao Venkat', faculty: 32, students: 520, budget: 'Rs.45L', spent: 'Rs.38L', utilization: 84, avgAttendance: 82, passRate: 88 },
  { name: 'Electronics & Communication', code: 'ECE', hod: 'Dr. Mohan Rao', faculty: 24, students: 410, budget: 'Rs.38L', spent: 'Rs.30L', utilization: 79, avgAttendance: 78, passRate: 82 },
  { name: 'Electrical & Electronics', code: 'EEE', hod: 'Dr. Lakshmi Prasad', faculty: 18, students: 320, budget: 'Rs.30L', spent: 'Rs.26L', utilization: 87, avgAttendance: 81, passRate: 85 },
  { name: 'Mechanical Engineering', code: 'MECH', hod: 'Prof. Arun Kumar', faculty: 20, students: 380, budget: 'Rs.42L', spent: 'Rs.35L', utilization: 83, avgAttendance: 75, passRate: 78 },
  { name: 'Civil Engineering', code: 'CIVIL', hod: 'Dr. Bhavani Shankar', faculty: 14, students: 290, budget: 'Rs.28L', spent: 'Rs.22L', utilization: 79, avgAttendance: 73, passRate: 80 },
  { name: 'Information Technology', code: 'IT', hod: 'Prof. Suresh Yadav', faculty: 12, students: 310, budget: 'Rs.32L', spent: 'Rs.28L', utilization: 88, avgAttendance: 80, passRate: 86 },
  { name: 'AI & Data Science', code: 'AIDS', hod: 'Prof. Neha Gupta', faculty: 8, students: 220, budget: 'Rs.25L', spent: 'Rs.20L', utilization: 80, avgAttendance: 86, passRate: 90 },
];

export const staffMembers: StaffMember[] = [
  { id: 'S001', name: 'Dr. Rao Venkat', dept: 'CSE', role: 'faculty', designation: 'Professor & HOD', email: 'rao@mlrit.ac.in', phone: '9871234560', joinDate: '2010-06-15', status: 'active' },
  { id: 'S002', name: 'Dr. Sunita Devi', dept: 'CSE', role: 'faculty', designation: 'Associate Professor', email: 'sunita@mlrit.ac.in', phone: '9871234561', joinDate: '2012-07-01', status: 'active' },
  { id: 'S003', name: 'Prof. Ramesh Babu', dept: 'ECE', role: 'faculty', designation: 'Assistant Professor', email: 'ramesh@mlrit.ac.in', phone: '9871234562', joinDate: '2015-08-10', status: 'active' },
  { id: 'S004', name: 'Dr. Lakshmi Prasad', dept: 'EEE', role: 'faculty', designation: 'Professor & HOD', email: 'lakshmi@mlrit.ac.in', phone: '9871234563', joinDate: '2008-01-20', status: 'active' },
  { id: 'S005', name: 'Prof. Arun Kumar', dept: 'MECH', role: 'faculty', designation: 'Professor & HOD', email: 'arun@mlrit.ac.in', phone: '9871234564', joinDate: '2009-03-15', status: 'on_leave' },
  { id: 'S006', name: 'Dr. Kavitha Reddy', dept: 'CSE', role: 'faculty', designation: 'Associate Professor', email: 'kavitha@mlrit.ac.in', phone: '9871234565', joinDate: '2014-06-01', status: 'active' },
  { id: 'S007', name: 'Rajesh Kumar', dept: 'Admin', role: 'non-teaching', designation: 'Chief Admin Officer', email: 'rajesh@mlrit.ac.in', phone: '9871234570', joinDate: '2005-01-10', status: 'active' },
  { id: 'S008', name: 'Suman Devi', dept: 'Admin', role: 'non-teaching', designation: 'Accounts Officer', email: 'suman@mlrit.ac.in', phone: '9871234571', joinDate: '2011-04-15', status: 'active' },
  { id: 'S009', name: 'Vinod Sharma', dept: 'Admin', role: 'non-teaching', designation: 'Librarian', email: 'vinod@mlrit.ac.in', phone: '9871234572', joinDate: '2013-09-01', status: 'active' },
  { id: 'S010', name: 'Pradeep Rao', dept: 'Admin', role: 'non-teaching', designation: 'IT Systems Admin', email: 'pradeep@mlrit.ac.in', phone: '9871234573', joinDate: '2016-11-20', status: 'active' },
  { id: 'S011', name: 'Dr. Mohan Rao', dept: 'ECE', role: 'faculty', designation: 'Professor & HOD', email: 'mohan@mlrit.ac.in', phone: '9871234569', joinDate: '2007-05-10', status: 'active' },
  { id: 'S012', name: 'Anita Kumari', dept: 'Admin', role: 'non-teaching', designation: 'HR Manager', email: 'anita@mlrit.ac.in', phone: '9871234574', joinDate: '2014-02-01', status: 'active' },
];

export const feeRecords: FeeRecord[] = [
  { dept: 'CSE', totalStudents: 520, collected: 488, pending: 32, collectedAmt: 'Rs.5.86 Cr', pendingAmt: 'Rs.38.4L', rate: 94 },
  { dept: 'ECE', totalStudents: 410, collected: 378, pending: 32, collectedAmt: 'Rs.4.54 Cr', pendingAmt: 'Rs.38.4L', rate: 92 },
  { dept: 'EEE', totalStudents: 320, collected: 298, pending: 22, collectedAmt: 'Rs.3.58 Cr', pendingAmt: 'Rs.26.4L', rate: 93 },
  { dept: 'MECH', totalStudents: 380, collected: 342, pending: 38, collectedAmt: 'Rs.4.10 Cr', pendingAmt: 'Rs.45.6L', rate: 90 },
  { dept: 'CIVIL', totalStudents: 290, collected: 261, pending: 29, collectedAmt: 'Rs.3.13 Cr', pendingAmt: 'Rs.34.8L', rate: 90 },
  { dept: 'IT', totalStudents: 310, collected: 289, pending: 21, collectedAmt: 'Rs.3.47 Cr', pendingAmt: 'Rs.25.2L', rate: 93 },
  { dept: 'AIDS', totalStudents: 220, collected: 209, pending: 11, collectedAmt: 'Rs.2.51 Cr', pendingAmt: 'Rs.13.2L', rate: 95 },
];

export const expenses: ExpenseItem[] = [
  { id: 'EX-001', category: 'Lab Equipment', description: 'GPU Workstations for AI Lab — CSE', dept: 'CSE', amount: 'Rs.18,00,000', date: '2026-04-10', status: 'pending', approvedBy: '—' },
  { id: 'EX-002', category: 'Infrastructure', description: 'Seminar Hall construction — Block C', dept: 'Admin', amount: 'Rs.45,00,000', date: '2026-03-25', status: 'approved', approvedBy: 'Principal' },
  { id: 'EX-003', category: 'Library', description: 'Digital subscription renewal (IEEE, ACM)', dept: 'Library', amount: 'Rs.8,50,000', date: '2026-04-05', status: 'approved', approvedBy: 'Principal' },
  { id: 'EX-004', category: 'Maintenance', description: 'Block D flood damage repair', dept: 'Admin', amount: 'Rs.12,00,000', date: '2026-04-13', status: 'approved', approvedBy: 'Principal' },
  { id: 'EX-005', category: 'Events', description: 'TechnoVista 2026 — Annual Tech Fest', dept: 'All', amount: 'Rs.6,00,000', date: '2026-04-15', status: 'pending', approvedBy: '—' },
  { id: 'EX-006', category: 'Salary', description: 'April 2026 — Faculty & Staff payroll', dept: 'All', amount: 'Rs.1,25,00,000', date: '2026-04-01', status: 'approved', approvedBy: 'Accounts' },
  { id: 'EX-007', category: 'Lab Equipment', description: 'VLSI design workstations — ECE', dept: 'ECE', amount: 'Rs.10,00,000', date: '2026-03-20', status: 'approved', approvedBy: 'Principal' },
  { id: 'EX-008', category: 'Transport', description: 'College bus annual maintenance', dept: 'Admin', amount: 'Rs.4,50,000', date: '2026-03-15', status: 'approved', approvedBy: 'Admin' },
];

export const assets: Asset[] = [
  { id: 'AS-001', name: 'Main Academic Block (A)', location: 'Campus North', category: 'building', condition: 'good', value: 'Rs.12 Cr', lastMaintenance: '2026-01-15' },
  { id: 'AS-002', name: 'Engineering Block (B)', location: 'Campus North', category: 'building', condition: 'good', value: 'Rs.10 Cr', lastMaintenance: '2025-12-10' },
  { id: 'AS-003', name: 'Block C (under expansion)', location: 'Campus South', category: 'building', condition: 'fair', value: 'Rs.8 Cr', lastMaintenance: '2025-11-20' },
  { id: 'AS-004', name: 'Block D (flood damaged)', location: 'Campus East', category: 'building', condition: 'poor', value: 'Rs.6 Cr', lastMaintenance: '2026-04-13' },
  { id: 'AS-005', name: 'AI/ML Research Lab', location: 'Block A, Floor 3', category: 'lab', condition: 'good', value: 'Rs.1.2 Cr', lastMaintenance: '2026-02-05' },
  { id: 'AS-006', name: 'VLSI Design Lab', location: 'Block B, Floor 2', category: 'lab', condition: 'good', value: 'Rs.85L', lastMaintenance: '2026-01-20' },
  { id: 'AS-007', name: 'Mechanical Workshop', location: 'Block B, Ground', category: 'lab', condition: 'fair', value: 'Rs.1.5 Cr', lastMaintenance: '2025-10-15' },
  { id: 'AS-008', name: 'Central Library', location: 'Campus Center', category: 'building', condition: 'good', value: 'Rs.5 Cr', lastMaintenance: '2026-03-01' },
  { id: 'AS-009', name: 'College Bus Fleet (8 buses)', location: 'Transport Yard', category: 'vehicle', condition: 'fair', value: 'Rs.2.4 Cr', lastMaintenance: '2026-03-15' },
  { id: 'AS-010', name: 'Server Room Infrastructure', location: 'Block A, Basement', category: 'equipment', condition: 'good', value: 'Rs.65L', lastMaintenance: '2026-03-20' },
];

export const DEPT_CODES = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'Admin'];
