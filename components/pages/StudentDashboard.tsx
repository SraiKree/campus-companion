'use client';

import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Clock, CreditCard, FileText, 
  Heart, UserCircle, DollarSign
} from 'lucide-react';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { useAuth } from '@/contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { loading, attendanceStats, assignments, todayClasses, subjectPerformance, weeklyAttendance, leaveRequests, announcements } = useStudentDashboard();
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

  // Get next class info
  const nextClass = todayClasses[0] || {
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
      <div className="grid grid-cols-12 gap-6">
            {/* Hero Bento: Digital ID */}
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
                <div className="w-full aspect-square bg-white border border-[#e5e5e5] rounded-lg shadow-inner mb-4 flex items-center justify-center">
                  <div className="w-32 h-32 bg-[#1a1a1a]/5 rounded" />
                </div>
                <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider">SCAN FOR ENTRY</p>
              </div>
              <div className="absolute -right-96 -top-40 w-48 h-48 bg-[#e05252]/5 rounded-full blur-3xl" />
            </div>

            {/* Next Class */}
            <div className="col-span-4 bg-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#1a1a1a]">Next Class</h3>
                  <Clock className="w-[18px] h-[21px] text-[#666]" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#1a1a1a] tracking-tight mb-1">
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

            {/* Academic Performance */}
            <div className="col-span-5 bg-white rounded-2xl p-6">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Academic Performance</h3>
                  <p className="text-xs text-[#666]">Cumulative GPA Trend</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-[#8b5cf6]">{currentCGPA.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Current CGPA</p>
                </div>
              </div>
              <div className="flex items-end justify-between h-36 gap-2 px-2">
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
                      <span className="text-[10px] font-bold text-[#666] uppercase tracking-tight">
                        Sem {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-7 bg-white rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="bg-[#f2f0ed] border border-[#e5e5e5] rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-[#e5e5e5] transition-colors"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}>
                      <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wide">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Pending Tasks */}
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
            </div>

            {/* Campus Feed */}
            <div className="col-span-12 bg-white rounded-2xl p-6">
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
              <div className="grid grid-cols-3 gap-6">
                {latestAnnouncements.map((announcement, idx) => (
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
          </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
