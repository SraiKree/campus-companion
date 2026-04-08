'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Calendar, Clock, MapPin, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface FacultyClass {
  id: string;
  subject_name: string;
  subject_code: string;
  department: string;
  section: string;
  weekday: number;
  period_start: number;
  period_end: number;
  is_lab: boolean;
  room_number: string;
  academic_year: string;
  semester: string;
}

interface AcademicPeriod {
  year: string;
  semester: string;
  label: string;
}

interface Student {
  roll_number: string;
  name: string;
  department: string;
  section: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
  { number: 1, label: '9:20-10:20' },
  { number: 2, label: '10:20-11:20' },
  { number: 3, label: '11:20-12:20' },
  { number: 4, label: '1:10-2:10' },
  { number: 5, label: '2:10-3:10' },
  { number: 6, label: '3:10-4:10' },
];

export default function FacultyAttendancePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<FacultyClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [students, searchTerm]
  );

  const presentCount = Array.from(attendance.values()).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'faculty') {
        router.push('/');
      } else {
        fetchAvailablePeriods();
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedPeriod) fetchClasses();
  }, [selectedPeriod]);

  const fetchAvailablePeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await fetch('/api/faculty/attendance/periods');
      if (res.ok) {
        const data = await res.json();
        setAvailablePeriods(data.periods || []);
        if (data.periods?.length > 0) setSelectedPeriod(data.periods[0]);
      }
    } catch {
      toast.error('Failed to load academic periods');
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchClasses = async () => {
    if (!user?.id || !selectedPeriod) return;
    setLoadingClasses(true);
    try {
      const res = await fetch(`/api/faculty/classes?facultyId=${user.id}&academicYear=${selectedPeriod.year}&semester=${selectedPeriod.semester}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async (classData: FacultyClass) => {
    setLoadingStudents(true);
    setSearchTerm('');
    try {
      const res = await fetch(
        `/api/faculty/attendance/students?department=${classData.department}&section=${classData.section}&academicYear=${classData.academic_year}&semester=${classData.semester}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        const map = new Map<string, boolean>();
        (data.students || []).forEach((s: Student) => map.set(s.roll_number, true));
        setAttendance(map);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassSelect = (classData: FacultyClass) => {
    setSelectedClass(classData);
    fetchStudents(classData);
  };

  const toggle = (rollNumber: string) => {
    setAttendance(prev => {
      const next = new Map(prev);
      next.set(rollNumber, !next.get(rollNumber));
      return next;
    });
  };

  const markAll = (present: boolean) => {
    const map = new Map<string, boolean>();
    students.forEach(s => map.set(s.roll_number, present));
    setAttendance(map);
  };

  const handleSave = async () => {
    if (!selectedClass || !user?.id) return;
    setSavingAttendance(true);
    try {
      const attendanceData = Array.from(attendance.entries()).map(([roll, present]) => ({
        student_roll_number: roll,
        status: present ? 'present' : 'absent',
      }));
      const res = await fetch('/api/faculty/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          facultyId: user.id,
          date: new Date().toISOString().split('T')[0],
          academicYear: selectedClass.academic_year,
          semester: selectedClass.semester,
          attendance: attendanceData,
        }),
      });
      if (res.ok) {
        toast.success('Attendance saved');
        setSelectedClass(null);
        setStudents([]);
        setAttendance(new Map());
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const getPeriodLabel = (start: number, end: number) =>
    start === end
      ? `P${start} · ${PERIODS[start - 1]?.label}`
      : `P${start}–P${end} · ${PERIODS[start - 1]?.label}`;

  if (loading || !isAuthenticated || user?.role !== 'faculty') return null;

  return (
    <FacultyLayout>
      {loadingPeriods ? (
        <div className="flex items-center justify-center py-20 text-[#666]">Loading...</div>
      ) : !selectedClass ? (
        /* ── Class Selection ── */
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a]">Mark Attendance</h1>
              <p className="text-sm text-[#666] mt-0.5">Select a class to begin</p>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#666]" />
              <Select
                value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.semester}` : ''}
                onValueChange={(v) => {
                  const [year, semester] = v.split('-');
                  const p = availablePeriods.find(p => p.year === year && p.semester === semester);
                  if (p) setSelectedPeriod(p);
                }}
              >
                <SelectTrigger className="w-[200px] h-10 bg-white border-[#e5e5e5] rounded-xl text-sm">
                  <SelectValue placeholder="Academic period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((p) => (
                    <SelectItem key={`${p.year}-${p.semester}`} value={`${p.year}-${p.semester}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingClasses ? (
            <div className="flex items-center justify-center py-20 text-[#666]">Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#666] mb-4">No classes found</p>
              <Link href="/faculty/timetable">
                <Button className="bg-[#1a1a1a] text-white hover:bg-[#333] rounded-xl">Add Classes</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls)}
                  className="text-left bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:border-[#e05252]/40 hover:shadow-sm transition-all group"
                >
                  <div className="mb-3">
                    <p className="text-xs font-bold text-[#e05252] mb-1">{cls.subject_code}</p>
                    <p className="text-base font-semibold text-[#1a1a1a] leading-tight">{cls.subject_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] font-bold bg-[#f2f0ed] text-[#666] px-2 py-0.5 rounded-full">
                      {cls.department}-{cls.section}
                    </span>
                    {cls.is_lab && (
                      <span className="text-[10px] font-bold bg-[#e05252]/10 text-[#e05252] px-2 py-0.5 rounded-full">Lab</span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-[#666]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {WEEKDAYS[cls.weekday - 1]}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {getPeriodLabel(cls.period_start, cls.period_end)}
                    </div>
                    {cls.room_number && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {cls.room_number}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Attendance Marking ── */
        <div>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => { setSelectedClass(null); setStudents([]); setAttendance(new Map()); }}
              className="w-9 h-9 rounded-xl bg-white border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#666]" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1a1a1a]">
                {selectedClass.subject_code} · {selectedClass.subject_name}
              </h1>
              <p className="text-sm text-[#666]">
                {selectedClass.department}-{selectedClass.section} · {WEEKDAYS[selectedClass.weekday - 1]} · {getPeriodLabel(selectedClass.period_start, selectedClass.period_end)}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={savingAttendance || loadingStudents}
              className="px-5 py-2 bg-[#1a1a1a] text-white text-sm font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {savingAttendance ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {loadingStudents ? (
            <div className="flex items-center justify-center py-20 text-[#666]">Loading students...</div>
          ) : (
            <>
              {/* Stats + Controls */}
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl px-4 py-2.5">
                  <span className="text-xs text-[#666]">Total</span>
                  <span className="text-sm font-bold text-[#1a1a1a]">{students.length}</span>
                  <div className="w-px h-4 bg-[#e5e5e5]" />
                  <span className="text-xs text-emerald-600 font-semibold">P: {presentCount}</span>
                  <div className="w-px h-4 bg-[#e5e5e5]" />
                  <span className="text-xs text-red-500 font-semibold">A: {absentCount}</span>
                </div>
                <button
                  onClick={() => markAll(true)}
                  className="text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAll(false)}
                  className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors border border-red-100"
                >
                  Mark All Absent
                </button>
                <div className="ml-auto relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]/50" />
                  <Input
                    placeholder="Search by roll no or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-white border-[#e5e5e5] rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#666]">No students found</div>
                ) : (
                  <div className="divide-y divide-[#f2f0ed]">
                    {filteredStudents.map((student) => {
                      const isPresent = attendance.get(student.roll_number) ?? true;
                      return (
                        <div
                          key={student.roll_number}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-[#f9f8f6] transition-colors"
                        >
                          {/* Roll number — prominent */}
                          <span className="w-28 text-sm font-bold text-[#1a1a1a] shrink-0 font-mono">
                            {student.roll_number}
                          </span>
                          {/* Name */}
                          <span className="flex-1 text-sm text-[#666] truncate">{student.name}</span>
                          {/* Toggle */}
                          <button
                            onClick={() => toggle(student.roll_number)}
                            className={`w-20 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                            }`}
                          >
                            {isPresent ? 'Present' : 'Absent'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </FacultyLayout>
  );
}
