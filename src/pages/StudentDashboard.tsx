import DashboardHeader from '@/components/layout/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, CalendarOff, FileUp } from 'lucide-react';
import AttendanceView from '@/components/student/AttendanceView';
import LeaveRequests from '@/components/student/LeaveRequests';
import AssignmentSubmissions from '@/components/student/AssignmentSubmissions';

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="attendance">
        <DashboardHeader
          tabs={
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-1">
              <TabsTrigger value="attendance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <ClipboardList className="h-4 w-4" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="leave" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <CalendarOff className="h-4 w-4" /> Leave
              </TabsTrigger>
              <TabsTrigger value="assignments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <FileUp className="h-4 w-4" /> Assignments
              </TabsTrigger>
            </TabsList>
          }
        />
        <main className="p-4 md:p-6 max-w-5xl mx-auto">
          <TabsContent value="attendance" className="mt-0">
            <AttendanceView />
          </TabsContent>
          <TabsContent value="leave" className="mt-0">
            <LeaveRequests />
          </TabsContent>
          <TabsContent value="assignments" className="mt-0">
            <AssignmentSubmissions />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
