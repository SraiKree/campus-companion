'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ClassData {
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
  start_date: string;
  end_date: string | null;
  is_recurring: boolean;
  academic_year: string;
  semester: string;
}

const DEPARTMENTS = ['CSE', 'CSM', 'CSD', 'AERO', 'IT', 'MECH', 'EEE', 'CSIT', 'ECE', 'MBA'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ACADEMIC_YEARS = ['I', 'II', 'III', 'IV', 'I MBA', 'II MBA'];
const SEMESTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const PERIODS = [
  { number: 1, label: '9:20-10:20' },
  { number: 2, label: '10:20-11:20' },
  { number: 3, label: '11:20-12:20' },
  { number: 4, label: '1:10-2:10' },
  { number: 5, label: '2:10-3:10' },
  { number: 6, label: '3:10-4:10' },
];

export default function FacultyTimetablePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  
  // Form state with default academic year and semester
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    department: '',
    section: '',
    weekday: '',
    periodStart: '',
    periodEnd: '',
    isLab: false,
    roomNumber: '',
    isRecurring: false,
    academicYear: 'IV', // Default to final year
    semester: 'VII',    // Default to current semester
    notes: ''
  });

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  function getWeekDates() {
    const dates = [];
    for (let i = 0; i < 6; i++) { // Mon-Sat
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  }

  useEffect(() => {
    // Set a maximum timeout for the entire loading process
    const maxTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    if (authLoading) {
      return () => clearTimeout(maxTimeout);
    }

    if (!isAuthenticated) {
      router.push('/');
      clearTimeout(maxTimeout);
      return;
    }

    if (user?.role !== 'faculty') {
      router.push('/');
      clearTimeout(maxTimeout);
      return;
    }

    if (!user?.id) {
      setLoading(false);
      clearTimeout(maxTimeout);
      return;
    }

    fetchClasses().finally(() => clearTimeout(maxTimeout));

    return () => clearTimeout(maxTimeout);
  }, [authLoading, isAuthenticated, user?.role, user?.id, router]);

  const fetchClasses = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const url = `/api/faculty/classes?facultyId=${user.id}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      } else {
        console.error('Failed to fetch classes:', response.status, response.statusText);
        toast.error('Failed to load classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!user?.id) return;

    if (!formData.subjectName || !formData.subjectCode || !formData.department || 
        !formData.section || !formData.weekday || !formData.periodStart || 
        !formData.academicYear || !formData.semester) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.isLab && !formData.periodEnd) {
      toast.error('Please select end period for lab session');
      return;
    }

    try {
      const response = await fetch('/api/faculty/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: user.id,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setIsDialogOpen(false);
        resetForm();
        fetchClasses();
      } else {
        toast.error(data.error || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const handleDeleteClass = async (classId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Delete this class?')) return;

    try {
      const response = await fetch(`/api/faculty/classes?classId=${classId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Class deleted');
        fetchClasses();
      } else {
        toast.error('Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  const resetForm = () => {
    setFormData({
      subjectName: '',
      subjectCode: '',
      department: '',
      section: '',
      weekday: '',
      periodStart: '',
      periodEnd: '',
      isLab: false,
      roomNumber: '',
      isRecurring: false,
      academicYear: 'IV', // Keep default values
      semester: 'VII',
      notes: ''
    });
  };

  const getClassesForDayAndPeriod = (weekday: number, period: number, date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    return classes.filter(c => {
      // Check if class is on this weekday
      if (c.weekday !== weekday) return false;
      
      // Check if period matches
      if (period < c.period_start || period > c.period_end) return false;
      
      // Check if class is active on this date
      const classStartDate = new Date(c.start_date);
      const currentDate = new Date(dateStr);
      
      // Class must have started
      if (currentDate < classStartDate) return false;
      
      if (c.is_recurring) {
        // For recurring classes, check if we're within the 8-week period
        const weeksDiff = Math.floor((currentDate.getTime() - classStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff >= 0 && weeksDiff < 8;
      } else {
        // For non-recurring classes, they are persistent (repeat every week)
        // Check if current date is on or after start date and on the same weekday
        if (currentDate >= classStartDate) {
          // Calculate if this date falls on the same weekday as the class
          const daysDiff = Math.floor((currentDate.getTime() - classStartDate.getTime()) / (24 * 60 * 60 * 1000));
          return daysDiff % 7 === 0; // Same weekday
        }
      }
      
      return false;
    });
  };

  const weekDates = getWeekDates();
  const monthYear = currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading timetable...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'faculty') {
    return null;
  }

  return (
    <FacultyLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">{monthYear}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#141414] text-white hover:bg-[#141414]/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject Name *</Label>
                    <Input
                      placeholder="e.g., Data Structures"
                      value={formData.subjectName}
                      onChange={(e) => setFormData({...formData, subjectName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subject Code *</Label>
                    <Input
                      placeholder="e.g., CS201"
                      value={formData.subjectCode}
                      onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Section *</Label>
                    <Select value={formData.section} onValueChange={(value) => setFormData({...formData, section: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTIONS.map(section => (
                          <SelectItem key={section} value={section}>Section {section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Academic Year and Semester Selection */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h4 className="text-sm font-medium mb-3 text-foreground">Academic Period *</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Academic Year</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {ACADEMIC_YEARS.map((year) => (
                          <Button
                            key={year}
                            type="button"
                            variant={formData.academicYear === year ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormData({...formData, academicYear: year})}
                            className={`h-9 text-xs ${
                              formData.academicYear === year 
                                ? "bg-[#141414] text-white hover:bg-[#141414]/90" 
                                : "hover:bg-muted"
                            }`}
                          >
                            {year}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Semester</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {SEMESTERS.map((sem) => (
                          <Button
                            key={sem}
                            type="button"
                            variant={formData.semester === sem ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormData({...formData, semester: sem})}
                            className={`h-9 text-xs ${
                              formData.semester === sem 
                                ? "bg-[#141414] text-white hover:bg-[#141414]/90" 
                                : "hover:bg-muted"
                            }`}
                          >
                            {sem}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Day *</Label>
                    <Select value={formData.weekday} onValueChange={(value) => setFormData({...formData, weekday: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day, idx) => (
                          <SelectItem key={idx + 1} value={(idx + 1).toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Period *</Label>
                    <Select value={formData.periodStart} onValueChange={(value) => setFormData({...formData, periodStart: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map(period => (
                          <SelectItem key={period.number} value={period.number.toString()}>
                            P{period.number} ({period.label})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input
                      placeholder="e.g., 301"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isLab"
                    checked={formData.isLab}
                    onCheckedChange={(checked) => setFormData({...formData, isLab: checked as boolean, periodEnd: ''})}
                  />
                  <Label htmlFor="isLab" className="cursor-pointer">Lab session (spans multiple periods)</Label>
                </div>

                {formData.isLab && (
                  <div className="space-y-2">
                    <Label>End Period *</Label>
                    <Select value={formData.periodEnd} onValueChange={(value) => setFormData({...formData, periodEnd: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end period" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.filter(p => formData.periodStart && p.number > parseInt(formData.periodStart)).map(period => (
                          <SelectItem key={period.number} value={period.number.toString()}>
                            P{period.number} ({period.label})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked as boolean})}
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">Repeat for next 8 weeks</Label>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass} className="bg-[#141414] text-white hover:bg-[#141414]/90">
                    Create Class
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Grid */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {/* Header Row */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border">
              Time
            </div>
            {weekDates.map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={idx} className="p-3 text-center border-r border-border last:border-r-0">
                  <div className="text-sm font-medium text-muted-foreground">{WEEKDAYS[idx]}</div>
                  <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {PERIODS.map((period) => (
            <div key={period.number} className="grid grid-cols-7 border-b border-border last:border-b-0 min-h-[100px]">
              <div className="p-3 border-r border-border bg-muted/30 flex flex-col justify-center">
                <div className="text-xs font-medium text-muted-foreground">Period {period.number}</div>
                <div className="text-xs text-muted-foreground mt-1">{period.label}</div>
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayClasses = getClassesForDayAndPeriod(dayIdx + 1, period.number, date);
                return (
                  <div key={dayIdx} className="p-2 border-r border-border last:border-r-0 hover:bg-muted/30 transition-colors">
                    {dayClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={(e) => handleDeleteClass(cls.id, e)}
                        className="mb-2 last:mb-0 p-2 rounded-md bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors group"
                      >
                        <div className="text-xs font-semibold text-foreground truncate">
                          {cls.subject_code}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {cls.department}-{cls.section}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {cls.academic_year} - Sem {cls.semester}
                        </div>
                        {cls.room_number && (
                          <div className="text-xs text-muted-foreground truncate">
                            {cls.room_number}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
    </FacultyLayout>
  );
}