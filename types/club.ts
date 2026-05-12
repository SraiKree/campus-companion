// Club module TypeScript interfaces

export interface ClubInfo {
  id: string;
  name: string;
  description: string | null;
  advisor_name: string | null;
  contact_email: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface ClubCounts {
  members: number;
  events: number;
  announcements: number;
}

export interface ClubEvent {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  eligibility: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  title: string;
  body: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  roll_number: string;
  student_name: string | null;
  added_at: string;
}

export type ApplicationStatus = 'Pending' | 'Shortlisted' | 'Selected' | 'Rejected';

export interface ClubApplication {
  id: string;
  club_id: string;
  student_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  year: string | null;
  skills: string | null;
  resume_url: string | null;
  why_join: string | null;
  experience: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationActivityLog {
  id: string;
  application_id: string;
  club_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface TeamMember {
  name: string;
  role: string;
  department: string;
  year: string;
  avatar?: string;
}

export interface ClubAchievement {
  title: string;
  description: string;
  year: string;
  icon: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  type: 'photo' | 'video';
  date: string;
  color: string;
  event: string;
}

export interface AnalyticsData {
  memberGrowth: Array<{ month: string; members: number }>;
  eventParticipation: Array<{ event: string; participants: number; capacity: number }>;
  recruitmentFunnel: Array<{ name: string; value: number; color: string }>;
  engagementTrend: Array<{ month: string; events: number; announcements: number; members: number }>;
  overview: {
    totalMembers: number;
    activeEvents: number;
    totalEvents: number;
    pendingApplications: number;
    acceptedApplications: number;
    totalApplications: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'member_joined' | 'event_created' | 'application_submitted' | 'announcement_posted';
    message: string;
    time: string;
  }>;
}
