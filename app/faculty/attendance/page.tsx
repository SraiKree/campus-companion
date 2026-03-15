'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Clock, MapPin, Calendar, GraduationCap, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

interface AttendanceRecord {
  student_roll_number: string;
  status: 'present' | 'absent';
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
  
  // Academic period state
  const [availablePeriods, setAvailablePeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);

  // Pagination, sorting, and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'roll_number'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filtered and sorted students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [students, searchTerm, sortField, sortDirection]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);

  // Reset pagination when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'roll_number') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'roll_number') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'faculty') {
        router.push('/');
      } else {
        fetchAvailablePeriods();
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchClasses();
    }
  }, [selectedPeriod]);

  const fetchAvailablePeriods = async () => {
    setLoadingPeriods(true);
    try {
      const response = await fetch('/api/faculty/attendance/periods');
      if (response.ok) {
        const data = await response.json();
        setAvailablePeriods(data.periods || []);
        
        // Set current period as default (most recent)
        if (data.periods && data.periods.length > 0) {
          setSelectedPeriod(data.periods[0]);
        }
      } else {
        toast.error('Failed to load academic periods');
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      toast.error('Failed to load academic periods');
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchClasses = async () => {
    if (!user?.id || !selectedPeriod) return;
    
    setLoadingClasses(true);
    try {
      const response = await fetch(`/api/faculty/classes?facultyId=${user.id}&academicYear=${selectedPeriod.year}&semester=${selectedPeriod.semester}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      } else {
        toast.error('Failed to load classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async (classData: FacultyClass) => {
    setLoadingStudents(true);
    setSearchTerm(''); // Reset search when switching classes
    setCurrentPage(1); // Reset pagination
    try {
      const response = await fetch(`/api/faculty/attendance/students?department=${classData.department}&section=${classData.section}&academicYear=${classData.academic_year}&semester=${classData.semester}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        
        // Initialize attendance map - default all to present
        const attendanceMap = new Map<string, boolean>();
        data.students.forEach((student: Student) => {
          attendanceMap.set(student.roll_number, true);
        });
        setAttendance(attendanceMap);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassSelect = (classData: FacultyClass) => {
    setSelectedClass(classData);
    fetchStudents(classData);
  };

  const handleAttendanceChange = (rollNumber: string, isPresent: boolean) => {
    const newAttendance = new Map(attendance);
    newAttendance.set(rollNumber, isPresent);
    setAttendance(newAttendance);
  };

  const handleMarkAll = (isPresent: boolean) => {
    const newAttendance = new Map<string, boolean>();
    students.forEach(student => {
      newAttendance.set(student.roll_number, isPresent);
    });
    setAttendance(newAttendance);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !user?.id) return;

    setSavingAttendance(true);
    try {
      const attendanceData = Array.from(attendance.entries()).map(([rollNumber, isPresent]) => ({
        student_roll_number: rollNumber,
        status: isPresent ? 'present' : 'absent'
      }));

      const response = await fetch('/api/faculty/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          facultyId: user.id,
          date: new Date().toISOString().split('T')[0],
          academicYear: selectedClass.academic_year,
          semester: selectedClass.semester,
          attendance: attendanceData
        })
      });

      if (response.ok) {
        toast.success('Attendance saved successfully');
        setSelectedClass(null);
        setStudents([]);
        setAttendance(new Map());
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const getPeriodLabel = (start: number, end: number) => {
    if (start === end) {
      return `P${start} (${PERIODS[start - 1]?.label})`;
    }
    return `P${start}-P${end} (${PERIODS[start - 1]?.label} - ${PERIODS[end - 1]?.label})`;
  };

  const presentCount = Array.from(attendance.values()).filter(Boolean).length;
  const absentCount = students.length - presentCount;
  const filteredPresentCount = paginatedStudents.filter(student => attendance.get(student.roll_number)).length;
  const filteredAbsentCount = paginatedStudents.length - filteredPresentCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Attendance
            </Button>
            <Link href="/faculty/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto">
        {loadingPeriods ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading academic periods...</p>
          </div>
        ) : !selectedClass ? (
          // Classes List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <Select 
                    value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.semester}` : ''} 
                    onValueChange={(value) => {
                      const [year, semester] = value.split('-');
                      const period = availablePeriods.find(p => p.year === year && p.semester === semester);
                      if (period) setSelectedPeriod(period);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select academic period" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeriods.map((period) => (
                        <SelectItem key={`${period.year}-${period.semester}`} value={`${period.year}-${period.semester}`}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-muted-foreground">Select a class to mark attendance</p>
              </div>
            </div>

            {loadingClasses ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No classes found</p>
                <Link href="/faculty/timetable">
                  <Button>Create Classes</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classData) => (
                  <Card 
                    key={classData.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleClassSelect(classData)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {classData.subject_code} - {classData.subject_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {classData.department}-{classData.section}
                        </Badge>
                        {classData.is_lab && (
                          <Badge variant="outline">Lab</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {WEEKDAYS[classData.weekday - 1]}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {getPeriodLabel(classData.period_start, classData.period_end)}
                      </div>
                      {classData.room_number && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {classData.room_number}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Student Attendance View
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSelectedClass(null);
                  setStudents([]);
                  setAttendance(new Map());
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedClass.subject_code} - {selectedClass.subject_name}
                </h1>
                <p className="text-muted-foreground">
                  {selectedClass.department}-{selectedClass.section} • {WEEKDAYS[selectedClass.weekday - 1]} • {getPeriodLabel(selectedClass.period_start, selectedClass.period_end)}
                </p>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary and Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total: {students.length}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600">Present: {presentCount}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-red-600">Absent: {absentCount}</span>
                        </div>
                        {searchTerm && (
                          <div className="text-sm text-muted-foreground">
                            Showing: {filteredAndSortedStudents.length} filtered
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAll(true)}
                        >
                          Mark All Present
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAll(false)}
                        >
                          Mark All Absent
                        </Button>
                        <Button 
                          onClick={handleSaveAttendance}
                          disabled={savingAttendance}
                          className="bg-[#141414] text-white hover:bg-[#141414]/90"
                        >
                          {savingAttendance ? 'Saving...' : 'Save Attendance'}
                        </Button>
                      </div>
                    </div>

                    {/* Search and Controls */}
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or roll number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                          <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Students ({filteredAndSortedStudents.length})</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2"
                        >
                          Name {getSortIcon('name')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('roll_number')}
                          className="flex items-center gap-2"
                        >
                          Roll Number {getSortIcon('roll_number')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paginatedStudents.map((student) => (
                        <div 
                          key={student.roll_number}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={attendance.get(student.roll_number) || false}
                              onCheckedChange={(checked) => 
                                handleAttendanceChange(student.roll_number, checked as boolean)
                              }
                            />
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={attendance.get(student.roll_number) ? "default" : "destructive"}
                          >
                            {attendance.get(student.roll_number) ? "Present" : "Absent"}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
