import DashboardHeader from '@/components/layout/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, ClipboardCheck, BookOpen } from 'lucide-react';
import TimetableManager from '@/components/faculty/TimetableManager';
import AttendanceManager from '@/components/faculty/AttendanceManager';
import AssignmentManager from '@/components/faculty/AssignmentManager';

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="timetable">
        <DashboardHeader
          tabs={
            <TabsList className="bg-transparent border-0 p-0 h-auto gap-1">
              <TabsTrigger value="timetable" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <Clock className="h-4 w-4" /> Timetable
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <ClipboardCheck className="h-4 w-4" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="assignments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg gap-1.5 text-xs sm:text-sm px-3 py-2">
                <BookOpen className="h-4 w-4" /> Assignments
              </TabsTrigger>
            </TabsList>
          }
        />
        <main className="p-4 md:p-6 max-w-5xl mx-auto">
          <TabsContent value="timetable" className="mt-0">
            <TimetableManager />
          </TabsContent>
          <TabsContent value="attendance" className="mt-0">
            <AttendanceManager />
          </TabsContent>
          <TabsContent value="assignments" className="mt-0">
            <AssignmentManager />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
};

export default FacultyDashboard;
