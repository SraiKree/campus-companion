import type { UserRole } from '@/types/erp';

/** All roles that log in through the faculty/staff login flow (email + password) */
export const STAFF_ROLES: UserRole[] = ['faculty', 'principal', 'management', 'hostel', 'hod', 'club', 'admin', 'transport', 'library', 'hr', 'sport_admin'];

/** Map each role to its dashboard base path */
export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  student: '/student',
  faculty: '/faculty',
  principal: '/principal',
  management: '/management',
  hostel: '/hostel/dashboard',
  hod: '/hod',
  club: '/club',
  admin: '/admin',
  transport: '/transport',
  library: '/library',
  hr: '/hr',
  sport_admin: '/sport-admin',
};

/** Display labels for each role */
export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  principal: 'Principal',
  management: 'Management',
  hostel: 'Hostel',
  hod: 'Department Head',
  club: 'Club',
  admin: 'Admin Office',
  transport: 'Transport Admin',
  library: 'Library Admin',
  hr: 'HR',
  sport_admin: 'Sport Admin',
};

/** Check if a role uses the staff (email/password) login flow */
export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Get the dashboard path for a given role */
export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATH[role] ?? '/';
}

/** Validate that a string is a valid UserRole */
export function isValidRole(role: string): role is UserRole {
  return ['student', 'faculty', 'principal', 'management', 'hostel', 'hod', 'club', 'admin', 'transport', 'library', 'hr', 'sport_admin'].includes(role);
}
