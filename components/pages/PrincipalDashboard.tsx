'use client';

import OverviewTab from './principal/OverviewTab';
import ApprovalsTab from './principal/ApprovalsTab';
import StudentsTab from './principal/StudentsTab';
import FacultyTab from './principal/FacultyTab';
import EscalatedTab from './principal/EscalatedTab';
import ReportsTab from './principal/ReportsTab';
import TypeFilteredTab from './principal/TypeFilteredTab';

interface PrincipalDashboardProps {
  defaultTab?: string;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview:         { title: 'Principal Dashboard', subtitle: 'Command center — approvals, escalations & institutional oversight' },
  approvals:        { title: 'Approvals Inbox', subtitle: 'Review, approve, reject, or delegate all pending requests' },
  academic:         { title: 'Academic Approvals', subtitle: 'Courses, curriculum, recruitment & research — final authority only' },
  student_requests: { title: 'Student Requests', subtitle: 'Long leave, appeals, re-admission & scholarships' },
  finance:          { title: 'Financial Approvals', subtitle: 'Fee concessions, budgets & infrastructure funding' },
  events:           { title: 'Event Approvals', subtitle: 'Fests, inter-college events & guest lectures' },
  escalated:        { title: 'Escalated Items', subtitle: 'Priority engine — sorted by severity & time pending' },
  students:         { title: 'Student Intelligence', subtitle: 'Risk-driven directory — context for decisions, not request handling' },
  faculty:          { title: 'Faculty Directory', subtitle: 'Faculty records across all departments' },
  reports:          { title: 'Reports & Analytics', subtitle: 'Turnaround times, SLA compliance & department load' },
};

export default function PrincipalDashboard({ defaultTab = 'overview' }: PrincipalDashboardProps) {
  const info = TAB_TITLES[defaultTab] || TAB_TITLES.overview;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>{info.title}</h1>
        <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>{info.subtitle}</p>
      </div>

      {defaultTab === 'overview' && <OverviewTab />}
      {defaultTab === 'approvals' && <ApprovalsTab />}
      {defaultTab === 'academic' && <TypeFilteredTab type="academic" />}
      {defaultTab === 'student_requests' && <TypeFilteredTab type="student" />}
      {defaultTab === 'finance' && <TypeFilteredTab type="financial" />}
      {defaultTab === 'events' && <TypeFilteredTab type="event" />}
      {defaultTab === 'escalated' && <EscalatedTab />}
      {defaultTab === 'students' && <StudentsTab />}
      {defaultTab === 'faculty' && <FacultyTab />}
      {defaultTab === 'reports' && <ReportsTab />}
    </div>
  );
}
