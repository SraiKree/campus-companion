'use client';

import { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  MapPin, Clock, CreditCard, FileText,
  Heart, UserCircle, DollarSign, Plus, X, GripVertical, Share2, Copy, Check, Building2
} from 'lucide-react';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/components/ui/use-toast';

type WidgetType = 
  | 'next-class'
  | 'academic-performance'
  | 'quick-actions'
  | 'campus-feed'
  | 'attendance-summary'
  | 'upcoming-assignments'
  | 'empty';

interface Widget {
  id: string;
  type: WidgetType;
  gridArea: string;
}

const AVAILABLE_WIDGETS = [
  { type: 'next-class', name: 'Next Class', description: 'View your upcoming class' },
  { type: 'academic-performance', name: 'Academic Performance', description: 'Track your CGPA trend' },
  { type: 'quick-actions', name: 'Quick Actions', description: 'Access common tasks' },
  { type: 'campus-feed', name: 'Campus Feed', description: 'Latest announcements' },
  { type: 'attendance-summary', name: 'Attendance Summary', description: 'View attendance stats' },
  { type: 'upcoming-assignments', name: 'Upcoming Assignments', description: 'See pending tasks' },
] as const;

const DEFAULT_LAYOUT: Widget[] = [
  { id: 'widget-1', type: 'next-class', gridArea: '4' },
  { id: 'widget-2', type: 'academic-performance', gridArea: '5' },
  { id: 'widget-3', type: 'quick-actions', gridArea: '7' },
  { id: 'widget-4', type: 'campus-feed', gridArea: '12' },
];

const STORAGE_KEY = 'student-dashboard-layout';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { loading, attendanceStats, assignments, todayClasses, subjectPerformance, weeklyAttendance, leaveRequests, announcements } = useStudentDashboard();
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_LAYOUT);
  const [isWidgetMenuOpen, setIsWidgetMenuOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [copiedQR, setCopiedQR] = useState(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem(STORAGE_KEY);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setWidgets(parsed);
      } catch (error) {
        console.error('Failed to parse saved layout:', error);
      }
    }
  }, []);

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }
  }, [widgets]);

  const latestLeaveRequest = leaveRequests[0];
  const pendingLeaveCount = leaveRequests.filter((request) => request.status === 'pending').length;
  const latestAnnouncements = announcements.slice(0, 3);

  // Calculate CGPA trend data
  const cgpaData = [3.4, 3.6, 3.8, 3.7, 3.9];
  const currentCGPA = cgpaData[cgpaData.length - 1];
  const maxCGPA = 4.0;

  // Get student info with fallbacks
  const studentName = user?.name || 'Student';
  const studentRollNo = user?.roll_no || 'N/A';
  const studentDepartment = user?.department || 'Department';
  const studentClass = user?.class_name || 'Class';
  const userId = user?.id || '';

  // Generate public profile URL
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/student/profile/${userId}`
    : '';

  // Copy QR code URL to clipboard
  const handleCopyQR = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedQR(true);
      toast({
        title: 'Copied!',
        description: 'Profile link copied to clipboard',
      });
      setTimeout(() => setCopiedQR(false), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  // Share QR code
  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${studentName}'s Profile`,
          text: `View ${studentName}'s student profile`,
          url: profileUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopyQR();
    }
  };

  // Get next class info
  const nextClass = todayClasses[0] ? {
    ...todayClasses[0],
    startsIn: '14m'
  } : {
    subject: 'Advanced UI Patterns',
    room: 'Studio A, Design Block',
    time: '09:00 AM',
    startsIn: '14m'
  };

  // Quick action items
  const quickActions = [
    { label: 'Gate Pass', icon: CreditCard, color: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
    { label: 'Pay Fees', icon: DollarSign, color: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { label: 'Requests', icon: Heart, color: 'bg-rose-500/10', iconColor: 'text-rose-600' },
    { label: 'Counseling', icon: UserCircle, color: 'bg-purple-500/10', iconColor: 'text-purple-600' },
  ];

  const handleAddWidget = (widgetId: string, widgetType: WidgetType) => {
    // Check if widget type already exists
    const widgetExists = widgets.some(w => w.type === widgetType && w.id !== widgetId);
    if (widgetExists) {
      alert(`The ${widgetType.replace(/-/g, ' ')} widget is already on your dashboard. Remove it first to add it elsewhere.`);
      return;
    }

    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, type: widgetType } : w
    ));
    setIsWidgetMenuOpen(false);
    setSelectedWidgetId(null);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, type: 'empty' } : w
    ));
  };

  const resetLayout = () => {
    if (confirm('Are you sure you want to reset your dashboard to the default layout?')) {
      setWidgets(DEFAULT_LAYOUT);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportLayout = () => {
    const layoutJson = JSON.stringify(widgets, null, 2);
    const blob = new Blob([layoutJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get list of widget types that are already in use
  const usedWidgetTypes = new Set(widgets.filter(w => w.type !== 'empty').map(w => w.type));
  
  // Filter available widgets to show only those not already in use
  const availableWidgetsToAdd = AVAILABLE_WIDGETS.filter(
    widget => !usedWidgetTypes.has(widget.type as WidgetType)
  );

  const openWidgetMenu = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
    setIsWidgetMenuOpen(true);
  };

  const renderWidget = (widget: Widget) => {
    if (widget.type === 'empty') {
      return (
        <button
          onClick={() => openWidgetMenu(widget.id)}
          className="w-full h-full min-h-[200px] border-2 border-dashed border-[#e5e5e5] rounded-2xl flex items-center justify-center hover:border-[#e05252] hover:bg-[#e05252]/5 transition-all group"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-[#f2f0ed] rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-[#e05252]/10 transition-colors">
              <Plus className="w-6 h-6 text-[#666] group-hover:text-[#e05252]" />
            </div>
            <p className="text-sm font-medium text-[#666] group-hover:text-[#e05252]">Add Widget</p>
          </div>
        </button>
      );
    }

    const cols = parseInt(widget.gridArea);
    const isSmall = cols <= 4;
    const isMedium = cols > 4 && cols <= 6;
    const isLarge = cols > 6;

    switch (widget.type) {
      case 'next-class':
        return (
          <div className="bg-white rounded-2xl p-6 flex flex-col justify-between h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Next Class</h3>
                <Clock className="w-[18px] h-[21px] text-[#666]" />
              </div>
              <div>
                <h4 className={`font-bold text-[#1a1a1a] tracking-tight mb-1 ${isSmall ? 'text-lg' : 'text-2xl'}`}>
                  {nextClass.subject}
                </h4>
                <div className="flex items-center gap-1 text-sm text-[#666]">
                  <MapPin className="w-2 h-2.5" />
                  <span>{nextClass.room}</span>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-[#e5e5e5] mt-8">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-[#e05252]">Starts in {nextClass.startsIn}</span>
                <span className="text-[#666]">{nextClass.time}</span>
              </div>
              <div className="h-2 bg-[#f2f0ed] rounded-full overflow-hidden">
                <div className="h-full w-[70%] bg-[#e05252] rounded-full shadow-[0_0_12px_rgba(224,82,82,0.3)]" />
              </div>
            </div>
          </div>
        );

      case 'academic-performance':
        return (
          <div className="bg-white rounded-2xl p-6 h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg z-10"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Academic Performance</h3>
                {!isSmall && <p className="text-xs text-[#666]">Cumulative GPA Trend</p>}
              </div>
              <div className="text-right">
                <p className={`font-extrabold text-[#8b5cf6] ${isSmall ? 'text-2xl' : 'text-3xl'}`}>
                  {currentCGPA.toFixed(2)}
                </p>
                <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Current CGPA</p>
              </div>
            </div>
            <div className={`flex items-end justify-between gap-2 px-2 ${isSmall ? 'h-24' : 'h-36'}`}>
              {cgpaData.map((gpa, idx) => {
                const height = (gpa / maxCGPA) * 100;
                const isHighlighted = idx === cgpaData.length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div 
                      className={`w-full rounded-t-lg transition-all ${
                        isHighlighted 
                          ? 'bg-[#8b5cf6]' 
                          : idx === cgpaData.length - 2 
                          ? 'bg-[#8b5cf6]/10 border-t-2 border-[#8b5cf6]' 
                          : 'bg-[#f2f0ed] border border-[#e5e5e5] border-b-0'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    {!isSmall && (
                      <span className="text-[10px] font-bold text-[#666] uppercase tracking-tight">
                        Sem {idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'quick-actions':
        return (
          <div className="bg-white rounded-2xl p-6 h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg z-10"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6">Quick Actions</h3>
            <div className={`grid gap-4 mb-8 ${isSmall ? 'grid-cols-2' : isMedium ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-[#e5e5e5] transition-colors"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}>
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wide text-center">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            
            {isLarge && (
              <div className="border-t border-[#e5e5e5] pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#666] uppercase tracking-widest">Pending Tasks</h4>
                  <button className="text-[10px] font-bold text-[#e05252]">VIEW ALL</button>
                </div>
                <div className="space-y-3">
                  {assignments.slice(0, 2).map((assignment, idx) => (
                    <div
                      key={idx}
                      className={`bg-[#f2f0ed] border-l-4 ${
                        idx === 0 ? 'border-[#e05252]' : 'border-[#8b5cf6]'
                      } rounded-lg p-3 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-3 h-3.5 text-[#666]" />
                        <span className="text-sm font-medium text-[#1a1a1a]">{assignment.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#666]">
                        {idx === 0 ? 'TOMORROW' : 'FRIDAY'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'campus-feed':
        return (
          <div className="bg-white rounded-2xl p-6 h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg z-10"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1a1a1a]">Campus Feed</h3>
              <div className="flex gap-2">
                <Button className="bg-[#e05252] hover:bg-[#e05252]/90 text-white text-xs font-bold h-7 px-4 rounded-full">
                  Announcements
                </Button>
                <Button variant="ghost" className="text-[#666] text-xs font-bold h-7 px-4 rounded-full">
                  Events
                </Button>
              </div>
            </div>
            <div className={`grid gap-6 ${isSmall ? 'grid-cols-1' : isMedium ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {latestAnnouncements.slice(0, isSmall ? 1 : isMedium ? 2 : 3).map((announcement, idx) => (
                <div key={idx} className="bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl p-4">
                  <div className="w-full h-32 bg-[#e5e5e5] rounded-lg mb-3" />
                  <h4 className="text-sm font-bold text-[#1a1a1a] leading-snug mb-2">
                    {announcement.subject}
                  </h4>
                  <p className="text-xs text-[#666] leading-relaxed line-clamp-2">
                    {announcement.description || 'New announcement posted by faculty.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'attendance-summary':
        return (
          <div className="bg-white rounded-2xl p-6 h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg z-10"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6">Attendance Summary</h3>
            <div className="space-y-4">
              <div className="text-center p-6 bg-[#f2f0ed] rounded-xl">
                <p className={`font-extrabold text-[#1a1a1a] ${isSmall ? 'text-3xl' : 'text-5xl'}`}>
                  {attendanceStats.attendanceRate}%
                </p>
                <p className="text-sm text-[#666] mt-2">Overall Attendance</p>
              </div>
              {!isSmall && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-600">{attendanceStats.presentClasses}</p>
                    <p className="text-xs text-[#666] mt-1">Present</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.totalClasses - attendanceStats.presentClasses}</p>
                    <p className="text-xs text-[#666] mt-1">Absent</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'upcoming-assignments':
        return (
          <div className="bg-white rounded-2xl p-6 h-full relative group">
            <button
              onClick={() => handleRemoveWidget(widget.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#f2f0ed] rounded-lg z-10"
            >
              <X className="w-4 h-4 text-[#666]" />
            </button>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-6">Upcoming Assignments</h3>
            <div className="space-y-3">
              {assignments.slice(0, isSmall ? 2 : isMedium ? 3 : 4).map((assignment, idx) => (
                <div
                  key={idx}
                  className="bg-[#f2f0ed] border-l-4 border-[#e05252] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-[#666]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1a1a1a]">{assignment.title}</p>
                        {!isSmall && <p className="text-xs text-[#666]">{assignment.subject}</p>}
                      </div>
                    </div>
                    <Badge className="bg-[#e05252]/10 text-[#e05252] border-0 text-[10px]">
                      DUE SOON
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading your dashboard...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="relative">
        {/* Hostel section — only shown for hostellers */}
        {user?.isHosteller && (
          <Link href="/student/hostel">
            <div className="mb-6 bg-white rounded-2xl p-6 border border-[#e5e5e5] flex items-center gap-4 hover:border-[#e05252] transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#e05252]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#e05252]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">
                  Hostel
                </p>
                <p className="text-base font-semibold text-[#1a1a1a]">
                  View your room, roommates & mess menu
                </p>
              </div>
              <span className="text-xs font-bold text-[#e05252]">OPEN →</span>
            </div>
          </Link>
        )}

        {/* Dashboard Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={exportLayout}
            className="px-3 py-1.5 text-xs font-medium text-[#666] hover:text-[#1a1a1a] border border-[#e5e5e5] rounded-lg hover:border-[#e05252] transition-colors"
          >
            Export Layout
          </button>
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 text-xs font-medium text-[#666] hover:text-[#e05252] border border-[#e5e5e5] rounded-lg hover:border-[#e05252] transition-colors"
          >
            Reset to Default
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Hero Bento: Digital ID - Fixed, not customizable */}
          <div className="col-span-8 bg-white rounded-2xl p-8 flex gap-8 relative overflow-hidden">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20 hover:bg-[#e05252]/10 text-[10px] font-bold tracking-wider mb-4">
                  ACTIVE ENROLLMENT
                </Badge>
                <h2 className="text-5xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">
                  {studentName}
                </h2>
                <p className="text-lg font-medium text-[#666]">
                  {studentDepartment} • {studentClass}
                </p>
              </div>
              <div className="flex gap-8 pt-8 border-t border-[#e5e5e5] mt-8">
                <div>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">Roll Number</p>
                  <p className="text-xl font-bold text-[#1a1a1a]">{studentRollNo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1">Department</p>
                  <p className="text-xl font-bold text-[#1a1a1a]">{studentDepartment}</p>
                </div>
              </div>
            </div>
            <div className="w-48 bg-[#f2f0ed] border border-[#e5e5e5] rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-full aspect-square bg-white border border-[#e5e5e5] rounded-lg shadow-inner mb-4 flex items-center justify-center p-3">
                {profileUrl && (
                  <QRCodeSVG
                    value={profileUrl}
                    size={128}
                    level="H"
                    includeMargin={false}
                    className="w-full h-full"
                  />
                )}
              </div>
              <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-3">SCAN FOR PROFILE</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleCopyQR}
                  className="flex-1 p-2 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#e5e5e5] transition-colors flex items-center justify-center"
                  title="Copy link"
                >
                  {copiedQR ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#666]" />
                  )}
                </button>
                <button
                  onClick={handleShareQR}
                  className="flex-1 p-2 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#e5e5e5] transition-colors flex items-center justify-center"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4 text-[#666]" />
                </button>
              </div>
            </div>
            <div className="absolute -right-96 -top-40 w-48 h-48 bg-[#e05252]/5 rounded-full blur-3xl" />
          </div>

          {/* Customizable Widgets */}
          {widgets.map((widget) => {
            const colSpan = parseInt(widget.gridArea);
            const colSpanClass = 
              colSpan === 1 ? 'col-span-1' :
              colSpan === 2 ? 'col-span-2' :
              colSpan === 3 ? 'col-span-3' :
              colSpan === 4 ? 'col-span-4' :
              colSpan === 5 ? 'col-span-5' :
              colSpan === 6 ? 'col-span-6' :
              colSpan === 7 ? 'col-span-7' :
              colSpan === 8 ? 'col-span-8' :
              colSpan === 9 ? 'col-span-9' :
              colSpan === 10 ? 'col-span-10' :
              colSpan === 11 ? 'col-span-11' :
              'col-span-12';
            
            return (
              <div key={widget.id} className={colSpanClass}>
                {renderWidget(widget)}
              </div>
            );
          })}
        </div>

        {/* Widget Selection Menu - Slides in from right */}
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-[#e5e5e5] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            isWidgetMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1a1a1a]">Add Widget</h2>
            <button
              onClick={() => {
                setIsWidgetMenuOpen(false);
                setSelectedWidgetId(null);
              }}
              className="p-2 hover:bg-[#f2f0ed] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#666]" />
            </button>
          </div>

          <div className="p-6 space-y-3 overflow-y-auto h-[calc(100%-88px)]">
            {availableWidgetsToAdd.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#666] mb-2">All widgets are already on your dashboard!</p>
                <p className="text-sm text-[#666]">Remove a widget to add it to a different position.</p>
              </div>
            ) : (
              availableWidgetsToAdd.map((widget) => (
                <button
                  key={widget.type}
                  onClick={() => selectedWidgetId && handleAddWidget(selectedWidgetId, widget.type as WidgetType)}
                  className="w-full text-left p-4 border-2 border-[#e5e5e5] rounded-xl hover:border-[#e05252] hover:bg-[#e05252]/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#f2f0ed] rounded-lg flex items-center justify-center group-hover:bg-[#e05252]/10 transition-colors flex-shrink-0">
                      <GripVertical className="w-5 h-5 text-[#666] group-hover:text-[#e05252]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1a1a1a] mb-1">{widget.name}</h3>
                      <p className="text-sm text-[#666]">{widget.description}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
            
            {/* Layout Info */}
            <div className="mt-6 p-4 bg-[#f2f0ed] rounded-xl">
              <h4 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
                Current Layout
              </h4>
              <div className="space-y-1 text-xs text-[#666]">
                <p>Active Widgets: {widgets.filter(w => w.type !== 'empty').length}</p>
                <p>Empty Slots: {widgets.filter(w => w.type === 'empty').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isWidgetMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => {
              setIsWidgetMenuOpen(false);
              setSelectedWidgetId(null);
            }}
          />
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
