export const SPORT_CATEGORIES = [
  'Cricket',
  'Football',
  'Basketball',
  'Badminton',
  'Athletics',
  'Indoor Games',
  'Volleyball',
  'Kabaddi',
  'Throwball',
  'Gymnasium',
] as const;

export type SportCategory = (typeof SPORT_CATEGORIES)[number];

export const EVENT_STATUSES = [
  'Upcoming',
  'Ongoing',
  'Completed',
  'Cancelled',
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const REGISTRATION_STATUSES = [
  'Pending',
  'Approved',
  'Rejected',
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const ACHIEVEMENT_POSITIONS = [
  'Winner',
  'Runner-up',
  'Third Place',
  'Participant',
  'Special Mention',
] as const;

export type AchievementPosition = (typeof ACHIEVEMENT_POSITIONS)[number];

export interface Sport {
  id: string;
  name: string;
  category: SportCategory;
  coach: string | null;
  coach_email: string | null;
  schedule: string | null;
  venue: string | null;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SportEvent {
  id: string;
  sport_id: string;
  sport_name?: string;
  sport_category?: SportCategory;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  eligibility: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  status: EventStatus;
  winner: string | null;
  runner_up: string | null;
  third_place: string | null;
  results_notes: string | null;
  registration_count?: number;
  created_at: string;
}

export interface SportRegistration {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string | null;
  student_roll_number: string | null;
  student_department: string | null;
  notes: string | null;
  status: RegistrationStatus;
  reviewed_at: string | null;
  registered_at: string;
  event?: Partial<SportEvent>;
}

export interface SportTeam {
  id: string;
  sport_id: string;
  sport_name?: string;
  name: string;
  captain_name: string | null;
  description: string | null;
  created_at: string;
  members?: SportTeamMember[];
}

export interface SportTeamMember {
  id: string;
  team_id: string;
  student_id: string;
  student_name: string | null;
  student_roll_number: string | null;
  position: string | null;
  joined_at: string;
}

export const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Cancelled',
  'Completed',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface SportCourt {
  id: string;
  sport_id: string | null;
  sport_name?: string;
  sport_category?: SportCategory;
  name: string;
  location: string | null;
  capacity: number | null;
  max_players: number;
  description: string | null;
  opens_at: string;
  closes_at: string;
  slot_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface CourtBookingPlayer {
  id: string;
  booking_id: string;
  roll_number: string;
  player_name: string | null;
  added_at: string;
}

export interface SportEquipment {
  id: string;
  sport_id: string | null;
  name: string;
  description: string | null;
  total_quantity: number;
  available_quantity?: number;
  is_active: boolean;
  created_at: string;
}

export interface BookingEquipment {
  id: string;
  booking_id: string;
  equipment_id: string;
  equipment_name?: string;
  quantity: number;
  created_at: string;
}

export interface CourtBooking {
  id: string;
  court_id: string;
  court_name?: string;
  sport_name?: string;
  location?: string;
  student_id: string;
  student_name: string | null;
  student_roll_number: string | null;
  student_department: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: BookingStatus;
  created_at: string;
  players?: CourtBookingPlayer[];
  equipment?: BookingEquipment[];
}

export interface SportAchievement {
  id: string;
  student_id: string;
  event_id: string | null;
  sport_id: string | null;
  title: string;
  position: AchievementPosition | null;
  description: string | null;
  certificate_url: string | null;
  awarded_at: string;
  sport_name?: string;
  event_name?: string;
}
