import { supabaseAdmin } from './supabase-admin';

export interface ActivityData {
  userId: string;
  rollNumber: string;
  activityType: string;
  activityDetails?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(data: ActivityData) {
  try {
    await supabaseAdmin
      .from('student_activity_log')
      .insert({
        user_id: data.userId,
        roll_number: data.rollNumber,
        activity_type: data.activityType,
        activity_details: data.activityDetails || {},
        ip_address: data.ipAddress || 'unknown',
        user_agent: data.userAgent || 'unknown'
      });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw - activity logging shouldn't break the main flow
  }
}

// Common activity types
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW_ATTENDANCE: 'view_attendance',
  VIEW_GRADES: 'view_grades',
  VIEW_ASSIGNMENTS: 'view_assignments',
  FAILED_LOGIN: 'failed_login',
  SESSION_EXPIRED: 'session_expired'
} as const;