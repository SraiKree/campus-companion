export const ANNOUNCEMENT_CLUBS = [
  'Came Club',
  'Club Lit',
  'CIE Club',
  'Apex',
  'Scope',
  'EWB',
  'NSS',
  'Code Club',
  'Aim Club',
  'MECH Club',
  'Robotics Club',
  'Squad Club',
  'IT Club',
] as const;

export type AnnouncementClub = (typeof ANNOUNCEMENT_CLUBS)[number];

export interface AnnouncementRecord {
  id: string;
  subject: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  club_name: AnnouncementClub;
  created_at: string;
  faculty_id: string;
  faculty_name?: string;
}
