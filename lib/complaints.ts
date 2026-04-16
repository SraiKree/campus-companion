export const COMPLAINT_CATEGORIES = [
  'Academic',
  'Infrastructure',
  'Hostel',
  'Faculty',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  'Submitted',
  'In Review',
  'Resolved',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const DEPARTMENTS = [
  'CSE',
  'CSM',
  'CSD',
  'CSO',
  'IT',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'MBA',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// Faculty designations that control access level
export const PRIVILEGED_DESIGNATIONS = ['principal', 'chairman'] as const;

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  department: string;
  image_urls: string[];
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  // Only populated for principal/chairman
  student_name?: string;
  student_roll_number?: string;
}
