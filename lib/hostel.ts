export interface HostelRoom {
  id: string;
  room_no: string;
  block: string;
  capacity: number;
}

export interface Roommate {
  roll_number: string;
  name: string;
  department?: string;
  year?: number;
}

export interface HostelStudentDetails {
  roll_number: string;
  name: string;
  room_no: string;
  block: string;
  roommates: Roommate[];
}

export interface HostelAdminStudentRow {
  roll_number: string;
  name: string;
  department?: string;
  year?: number;
  room_no: string;
  block: string;
  allocated_at: string;
}

export interface HostelLeftStudentRow {
  roll_number: string;
  name: string;
  department?: string;
  previous_room_no: string;
  previous_block: string;
  left_at: string | null;
}

export interface MessMenuRow {
  day_of_week:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  breakfast: string | null;
  lunch: string | null;
  snacks: string | null;
  dinner: string | null;
}

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
