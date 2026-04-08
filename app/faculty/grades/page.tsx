'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Users, BookOpen, Award, Plus, Edit, Save, X, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface FacultyClass {
  id: string;
  subject_name: string;
  subject_code: string;
  department: string;
  section: string;
  academic_year: string;
  semester: string;
  weekday: number;
  period_start: number;
  period_end: number;
  is_lab: boolean;
}

interface Student {
  roll_number: string;
  name: string;
  department: string;
  section: string;
  year: string;
  semester: string;
}

interface StudentGrade {
  id?: string;
  student_roll_number: string;
  student_name: string;
  exam_type: 'Mid 1' | 'Mid 2';
  exam_marks: number;
  assignment_marks: number;
  other_marks: number;
  total_marks: number;
  percentage: number;
  grade: string;
}

interface AcademicPeriod {
  year: string;
  semester: string;
  label: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultyGradesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<FacultyClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<'Mid 1' | 'Mid 2'>('Mid 1');
  const [editingGrades, setEditingGrades] = useState<Map<string, StudentGrade>>(new Map());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // Pagination, sorting, and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'student_name' | 'student_roll_number' | 'total_marks' | 'percentage'>('student_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Helper functions (defined before useMemo to avoid hoisting issues)
  const getStudentGrade = (studentRollNumber: string): StudentGrade | null => {
    return grades.find(g => g.student_roll_number === studentRollNumber) || null;
  };

  const isEditing = (studentRollNumber: string): boolean => {
    return editingGrades.has(studentRollNumber);
  };

  // Filtered and sorted students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'student_name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortField === 'student_roll_number') {
        aValue = a.roll_number.toLowerCase();
        bValue = b.roll_number.toLowerCase();
      } else {
        // For grades-related sorting, get the grade data
        const aGrade = getStudentGrade(a.roll_number) || editingGrades.get(a.roll_number);
        const bGrade = getStudentGrade(b.roll_number) || editingGrades.get(b.roll_number);
        
        if (sortField === 'total_marks') {
          aValue = aGrade?.total_marks || 0;
          bValue = bGrade?.total_marks || 0;
        } else { // percentage
          aValue = aGrade?.percentage || 0;
          bValue = bGrade?.percentage || 0;
        }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [students, searchTerm, sortField, sortDirection, grades, editingGrades]);

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

  const handleSort = (field: 'student_name' | 'student_roll_number' | 'total_marks' | 'percentage') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'student_name' | 'student_roll_number' | 'total_marks' | 'percentage') => {
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

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchGrades();
    }
  }, [selectedClass, selectedExamType]);

  const fetchAvailablePeriods = async () => {
    try {
      const response = await fetch('/api/faculty/attendance/periods');
      if (response.ok) {
        const data = await response.json();
        setAvailablePeriods(data.periods || []);
        
        if (data.periods && data.periods.length > 0) {
          setSelectedPeriod(data.periods[0]);
        }
      } else {
        toast.error('Failed to load academic periods');
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
      toast.error('Failed to load academic periods');
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

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    setLoadingStudents(true);
    setSearchTerm(''); // Reset search when switching classes
    setCurrentPage(1); // Reset pagination
    try {
      const response = await fetch(`/api/faculty/attendance/students?department=${selectedClass.department}&section=${selectedClass.section}&academicYear=${selectedClass.academic_year}&semester=${selectedClass.semester}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
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

  const fetchGrades = async () => {
    if (!selectedClass) return;
    
    setLoadingGrades(true);
    try {
      const response = await fetch(`/api/faculty/grades?classId=${selectedClass.id}&examType=${selectedExamType}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
      } else {
        toast.error('Failed to load grades');
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleEditGrade = (studentRollNumber: string) => {
    const existingGrade = grades.find(g => g.student_roll_number === studentRollNumber);
    const student = students.find(s => s.roll_number === studentRollNumber);
    
    if (!student) return;

    const gradeToEdit: StudentGrade = existingGrade || {
      student_roll_number: studentRollNumber,
      student_name: student.name,
      exam_type: selectedExamType,
      exam_marks: 0,
      assignment_marks: 0,
      other_marks: 0,
      total_marks: 0,
      percentage: 0,
      grade: 'F'
    };

    const newEditingGrades = new Map(editingGrades);
    newEditingGrades.set(studentRollNumber, { ...gradeToEdit });
    setEditingGrades(newEditingGrades);
  };

  const handleGradeChange = (studentRollNumber: string, field: keyof StudentGrade, value: number) => {
    const newEditingGrades = new Map(editingGrades);
    const grade = newEditingGrades.get(studentRollNumber);
    
    if (grade) {
      (grade as any)[field] = value;
      
      // Recalculate totals
      grade.total_marks = grade.exam_marks + grade.assignment_marks + grade.other_marks;
      grade.percentage = (grade.total_marks / 40) * 100;
      
      // Calculate grade
      if (grade.percentage >= 90) grade.grade = 'A+';
      else if (grade.percentage >= 80) grade.grade = 'A';
      else if (grade.percentage >= 70) grade.grade = 'B+';
      else if (grade.percentage >= 60) grade.grade = 'B';
      else if (grade.percentage >= 50) grade.grade = 'C+';
      else if (grade.percentage >= 40) grade.grade = 'C';
      else if (grade.percentage >= 35) grade.grade = 'D';
      else grade.grade = 'F';
      
      newEditingGrades.set(studentRollNumber, grade);
      setEditingGrades(newEditingGrades);
    }
  };

  const handleSaveGrade = async (studentRollNumber: string) => {
    const grade = editingGrades.get(studentRollNumber);
    if (!grade || !selectedClass) return;

    setSavingGrades(true);
    try {
      const response = await fetch('/api/faculty/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          studentRollNumber,
          examType: selectedExamType,
          examMarks: grade.exam_marks,
          assignmentMarks: grade.assignment_marks,
          otherMarks: grade.other_marks,
          academicYear: selectedClass.academic_year,
          semester: selectedClass.semester
        })
      });

      if (response.ok) {
        toast.success('Grade saved successfully');
        
        // Remove from editing and refresh grades
        const newEditingGrades = new Map(editingGrades);
        newEditingGrades.delete(studentRollNumber);
        setEditingGrades(newEditingGrades);
        
        fetchGrades();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setSavingGrades(false);
    }
  };

  const handleCancelEdit = (studentRollNumber: string) => {
    const newEditingGrades = new Map(editingGrades);
    newEditingGrades.delete(studentRollNumber);
    setEditingGrades(newEditingGrades);
  };

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
    <FacultyLayout>
        {!selectedClass ? (
          // Classes List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Manage Grades</h1>
              <div className="flex items-center gap-4">
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
                <p className="text-muted-foreground">Select a class to manage grades</p>
              </div>
            </div>

            {loadingClasses ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Classes Found</h2>
                <p className="text-muted-foreground mb-4">Create classes in the timetable to manage grades</p>
                <Link href="/faculty/timetable">
                  <Button>Go to Timetable</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classData) => (
                  <Card 
                    key={classData.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedClass(classData)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {classData.subject_code} - {classData.subject_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">
                          {classData.department}-{classData.section}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {classData.academic_year} - Sem {classData.semester}
                        </Badge>
                        {classData.is_lab && (
                          <Badge variant="outline">Lab</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {WEEKDAYS[classData.weekday - 1]}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Period {classData.period_start}
                        {classData.period_end !== classData.period_start && `-${classData.period_end}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Grade Management View
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSelectedClass(null);
                  setStudents([]);
                  setGrades([]);
                  setEditingGrades(new Map());
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedClass.subject_code} - {selectedClass.subject_name}
                </h1>
                <p className="text-muted-foreground">
                  {selectedClass.department}-{selectedClass.section} • {selectedClass.academic_year} - Semester {selectedClass.semester}
                </p>
              </div>
              <Select value={selectedExamType} onValueChange={(value: 'Mid 1' | 'Mid 2') => setSelectedExamType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mid 1">Mid 1</SelectItem>
                  <SelectItem value="Mid 2">Mid 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingStudents || loadingGrades ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading students and grades...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search and Controls */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total: {students.length} students</span>
                        </div>
                        {searchTerm && (
                          <div className="text-sm text-muted-foreground">
                            Showing: {filteredAndSortedStudents.length} filtered
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Each Mid: Exam (30) + Assignment (5) + Other (5) = 40 marks total
                      </div>
                    </div>

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

                {/* Students Grades List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {selectedExamType} Grades ({filteredAndSortedStudents.length})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('student_name')}
                          className="flex items-center gap-2"
                        >
                          Name {getSortIcon('student_name')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('student_roll_number')}
                          className="flex items-center gap-2"
                        >
                          Roll Number {getSortIcon('student_roll_number')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('total_marks')}
                          className="flex items-center gap-2"
                        >
                          Marks {getSortIcon('total_marks')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('percentage')}
                          className="flex items-center gap-2"
                        >
                          Percentage {getSortIcon('percentage')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paginatedStudents.map((student) => {
                      const existingGrade = getStudentGrade(student.roll_number);
                      const editing = isEditing(student.roll_number);
                      const editingGrade = editingGrades.get(student.roll_number);

                      return (
                        <div 
                          key={student.roll_number}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                                </div>
                              </div>

                              {editing && editingGrade ? (
                                // Editing Mode
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                  <div>
                                    <Label className="text-xs">Exam (0-30)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="30"
                                      step="0.5"
                                      value={editingGrade.exam_marks}
                                      onChange={(e) => handleGradeChange(student.roll_number, 'exam_marks', parseFloat(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Assignment (0-5)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.5"
                                      value={editingGrade.assignment_marks}
                                      onChange={(e) => handleGradeChange(student.roll_number, 'assignment_marks', parseFloat(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Other (0-5)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.5"
                                      value={editingGrade.other_marks}
                                      onChange={(e) => handleGradeChange(student.roll_number, 'other_marks', parseFloat(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Total</Label>
                                    <div className="h-8 flex items-center px-3 bg-muted rounded text-sm">
                                      {editingGrade.total_marks.toFixed(1)}/40
                                    </div>
                                  </div>
                                </div>
                              ) : existingGrade ? (
                                // Display Mode with existing grade
                                <div className="grid grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Exam:</span> {existingGrade.exam_marks}/30
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Assignment:</span> {existingGrade.assignment_marks}/5
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Other:</span> {existingGrade.other_marks}/5
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total:</span> {existingGrade.total_marks}/40
                                  </div>
                                </div>
                              ) : (
                                // No grade yet
                                <p className="text-sm text-muted-foreground">No grade assigned yet</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {existingGrade && !editing && (
                                <div className="text-right">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-sm px-2 py-1"
                                  >
                                    {existingGrade.grade}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {existingGrade.percentage.toFixed(1)}%
                                  </p>
                                </div>
                              )}

                              {editing && editingGrade && (
                                <div className="text-right">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-sm px-2 py-1"
                                  >
                                    {editingGrade.grade}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {editingGrade.percentage.toFixed(1)}%
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                {editing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveGrade(student.roll_number)}
                                      disabled={savingGrades}
                                      className="h-8 px-3"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelEdit(student.roll_number)}
                                      className="h-8 px-3"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditGrade(student.roll_number)}
                                    className="h-8 px-3"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
    </FacultyLayout>
  );
}