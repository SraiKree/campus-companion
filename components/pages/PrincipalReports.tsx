'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle, Trophy, Users, GraduationCap, Building2, TrendingDown, Star,
} from 'lucide-react';

// ── Mock Data ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS'];
const YEARS = ['All', '1st', '2nd', '3rd', '4th'];

interface StudentReport {
  name: string;
  roll: string;
  dept: string;
  year: string;
  attendance: number;
  gpa: number;
}

interface FacultyReport {
  name: string;
  dept: string;
  classesTaken: number;
  rating: number;
}

interface DepartmentReport {
  department: string;
  totalStudents: number;
  avgAttendance: number;
}

const studentReports: StudentReport[] = [
  { name: 'Anil Kumar', roll: '23R21A0501', dept: 'CSE', year: '2nd', attendance: 92, gpa: 9.1 },
  { name: 'Priya Sharma', roll: '23R21A0502', dept: 'CSE', year: '2nd', attendance: 68, gpa: 7.8 },
  { name: 'Rahul Reddy', roll: '23R21A1201', dept: 'ECE', year: '2nd', attendance: 55, gpa: 6.2 },
  { name: 'Sneha Patil', roll: '22R21A0401', dept: 'EEE', year: '3rd', attendance: 89, gpa: 8.9 },
  { name: 'Vikram Singh', roll: '22R21A0301', dept: 'MECH', year: '3rd', attendance: 72, gpa: 7.1 },
  { name: 'Ananya Das', roll: '24R21A0503', dept: 'CSE', year: '1st', attendance: 95, gpa: 9.5 },
  { name: 'Karthik Nair', roll: '23R21A6601', dept: 'IT', year: '2nd', attendance: 61, gpa: 6.8 },
  { name: 'Divya Joshi', roll: '22R21A1202', dept: 'ECE', year: '3rd', attendance: 84, gpa: 8.4 },
  { name: 'Ravi Teja', roll: '24R21A0201', dept: 'CIVIL', year: '1st', attendance: 70, gpa: 7.0 },
  { name: 'Meena Kumari', roll: '23R21A5001', dept: 'AIDS', year: '2nd', attendance: 91, gpa: 9.0 },
  { name: 'Suresh Babu', roll: '21R21A0101', dept: 'CSE', year: '4th', attendance: 78, gpa: 8.0 },
  { name: 'Lakshmi Devi', roll: '21R21A1203', dept: 'ECE', year: '4th', attendance: 65, gpa: 6.5 },
  { name: 'Ajay Mohan', roll: '22R21A0302', dept: 'MECH', year: '3rd', attendance: 58, gpa: 5.9 },
  { name: 'Pooja Rani', roll: '24R21A6602', dept: 'IT', year: '1st', attendance: 88, gpa: 8.7 },
  { name: 'Harish Chandra', roll: '23R21A0402', dept: 'EEE', year: '2nd', attendance: 74, gpa: 7.5 },
  { name: 'Nithya Sri', roll: '22R21A5002', dept: 'AIDS', year: '3rd', attendance: 93, gpa: 9.3 },
  { name: 'Deepak Kumar', roll: '24R21A0202', dept: 'CIVIL', year: '1st', attendance: 47, gpa: 5.2 },
  { name: 'Swathi Reddy', roll: '21R21A0504', dept: 'CSE', year: '4th', attendance: 96, gpa: 9.7 },
];

const facultyReports: FacultyReport[] = [
  { name: 'Dr. Rao Venkat', dept: 'CSE', classesTaken: 142, rating: 4.8 },
  { name: 'Dr. Sunita Devi', dept: 'CSE', classesTaken: 138, rating: 4.5 },
  { name: 'Prof. Ramesh Babu', dept: 'ECE', classesTaken: 130, rating: 4.2 },
  { name: 'Dr. Lakshmi Prasad', dept: 'EEE', classesTaken: 125, rating: 4.6 },
  { name: 'Prof. Arun Kumar', dept: 'MECH', classesTaken: 118, rating: 3.9 },
  { name: 'Dr. Kavitha Reddy', dept: 'CSE', classesTaken: 145, rating: 4.9 },
  { name: 'Prof. Suresh Yadav', dept: 'IT', classesTaken: 132, rating: 4.3 },
  { name: 'Dr. Bhavani Shankar', dept: 'CIVIL', classesTaken: 110, rating: 4.1 },
  { name: 'Prof. Neha Gupta', dept: 'AIDS', classesTaken: 128, rating: 4.7 },
  { name: 'Dr. Mohan Rao', dept: 'ECE', classesTaken: 135, rating: 4.4 },
];

const departmentReports: DepartmentReport[] = [
  { department: 'CSE', totalStudents: 520, avgAttendance: 82 },
  { department: 'ECE', totalStudents: 410, avgAttendance: 78 },
  { department: 'EEE', totalStudents: 320, avgAttendance: 81 },
  { department: 'MECH', totalStudents: 380, avgAttendance: 75 },
  { department: 'CIVIL', totalStudents: 290, avgAttendance: 73 },
  { department: 'IT', totalStudents: 310, avgAttendance: 80 },
  { department: 'AIDS', totalStudents: 220, avgAttendance: 86 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function attendanceColor(pct: number): string {
  if (pct >= 85) return '#22c55e';
  if (pct >= 75) return 'var(--ch-text)';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function ratingStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      ))}
      {half && <Star className="h-3.5 w-3.5 fill-yellow-400/50 text-yellow-400" />}
      <span className="ml-1 text-xs font-medium" style={{ color: 'var(--ch-text)' }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ── Filters bar (reused per tab) ──────────────────────────────────────────────

function Filters({
  dept, setDept, year, setYear, showYear = true,
}: {
  dept: string;
  setDept: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  showYear?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={dept} onValueChange={setDept}>
        <SelectTrigger
          className="w-[180px] rounded-lg border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
        >
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          {DEPARTMENTS.map((d) => (
            <SelectItem key={d} value={d}>{d === 'All' ? 'All Departments' : d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showYear && (
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger
            className="w-[140px] rounded-lg border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
          >
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y === 'All' ? 'All Years' : `${y} Year`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ── Student Reports Tab ───────────────────────────────────────────────────────

function StudentReportsTab() {
  const [dept, setDept] = useState('All');
  const [year, setYear] = useState('All');

  const filtered = useMemo(() => {
    return studentReports.filter((s) => {
      const matchDept = dept === 'All' || s.dept === dept;
      const matchYear = year === 'All' || s.year === year;
      return matchDept && matchYear;
    });
  }, [dept, year]);

  const lowAttendance = filtered.filter((s) => s.attendance < 75);
  const topPerformers = [...filtered].sort((a, b) => b.gpa - a.gpa).slice(0, 5);

  return (
    <div className="space-y-6">
      <Filters dept={dept} setDept={setDept} year={year} setYear={setYear} />

      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>
              Below 75% Attendance
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#ef4444' }}>{lowAttendance.length}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
              students need attention
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>
              Top Performer
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {topPerformers[0] ? (
              <>
                <div className="text-xl font-bold" style={{ color: 'var(--ch-text)' }}>
                  {topPerformers[0].name}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                  GPA {topPerformers[0].gpa} &middot; {topPerformers[0].dept} &middot; {topPerformers[0].year} Year
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low attendance table */}
      {lowAttendance.length > 0 && (
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
              <TrendingDown className="h-4 w-4 text-red-500" />
              Students Below 75% Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                  <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                  <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance %</TableHead>
                  <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>GPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowAttendance.map((s) => (
                  <TableRow key={s.roll} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                    <TableCell>
                      <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>
                        {s.roll}
                      </code>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.dept}</Badge></TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{s.year}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: attendanceColor(s.attendance) }}>
                      {s.attendance}%
                    </TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{s.gpa.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top performers table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>#</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance %</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((s, i) => (
                <TableRow key={s.roll} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell style={{ color: 'var(--ch-muted)' }}>{i + 1}</TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                  <TableCell>
                    <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>
                      {s.roll}
                    </code>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.dept}</Badge></TableCell>
                  <TableCell style={{ color: 'var(--ch-text)' }}>{s.year}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: attendanceColor(s.attendance) }}>
                    {s.attendance}%
                  </TableCell>
                  <TableCell className="text-right font-bold" style={{ color: 'var(--ch-accent)' }}>
                    {s.gpa.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full student report table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
            <GraduationCap className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
            All Students ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Roll No</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Dept</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Year</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Attendance %</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>
                    No students match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.roll} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{s.name}</TableCell>
                    <TableCell>
                      <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>
                        {s.roll}
                      </code>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.dept}</Badge></TableCell>
                    <TableCell style={{ color: 'var(--ch-text)' }}>{s.year}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: attendanceColor(s.attendance) }}>
                      {s.attendance}%
                    </TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{s.gpa.toFixed(1)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Faculty Reports Tab ───────────────────────────────────────────────────────

function FacultyReportsTab() {
  const [dept, setDept] = useState('All');

  const filtered = useMemo(() => {
    return facultyReports.filter((f) => dept === 'All' || f.dept === dept);
  }, [dept]);

  return (
    <div className="space-y-6">
      <Filters dept={dept} setDept={setDept} year="" setYear={() => {}} showYear={false} />

      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
            <Users className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
            Faculty Performance ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Name</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Department</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Classes Taken</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8" style={{ color: 'var(--ch-muted)' }}>
                    No faculty match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.name} style={{ borderColor: 'var(--ch-border)' }}>
                    <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{f.name}</TableCell>
                    <TableCell><Badge variant="outline">{f.dept}</Badge></TableCell>
                    <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{f.classesTaken}</TableCell>
                    <TableCell>{ratingStars(f.rating)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Department Reports Tab ────────────────────────────────────────────────────

function DepartmentReportsTab() {
  const sorted = useMemo(() => {
    return [...departmentReports].sort((a, b) => b.totalStudents - a.totalStudents);
  }, []);

  const totalStudents = departmentReports.reduce((sum, d) => sum + d.totalStudents, 0);
  const overallAvg = Math.round(
    departmentReports.reduce((sum, d) => sum + d.avgAttendance, 0) / departmentReports.length,
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>Total Departments</CardTitle>
            <Building2 className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{departmentReports.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>Total Students</CardTitle>
            <GraduationCap className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>Overall Avg Attendance</CardTitle>
            <TrendingDown className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: attendanceColor(overallAvg) }}>{overallAvg}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
            <Building2 className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
            Department Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Department</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Total Students</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>Avg Attendance</TableHead>
                <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((d) => (
                <TableRow key={d.department} style={{ borderColor: 'var(--ch-border)' }}>
                  <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>
                    <Badge variant="outline" className="font-semibold">{d.department}</Badge>
                  </TableCell>
                  <TableCell className="text-right" style={{ color: 'var(--ch-text)' }}>{d.totalStudents}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: attendanceColor(d.avgAttendance) }}>
                    {d.avgAttendance}%
                  </TableCell>
                  <TableCell>
                    {d.avgAttendance >= 80 ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">Good</Badge>
                    ) : d.avgAttendance >= 75 ? (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/10">Average</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10">Needs Improvement</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PrincipalReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Reports</h1>
        <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
          Student, faculty, and department performance reports
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ch-text)' }}>Student Reports</h2>
          <StudentReportsTab />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ch-text)' }}>Faculty Reports</h2>
          <FacultyReportsTab />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ch-text)' }}>Department Reports</h2>
          <DepartmentReportsTab />
        </section>
      </div>
    </div>
  );
}
