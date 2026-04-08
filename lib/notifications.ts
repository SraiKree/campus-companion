import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TargetRole = 'student' | 'faculty' | 'all';

interface CreateNotificationOptions {
  title: string;
  message: string;
  priority?: Priority;
  target_role?: TargetRole;
  /** If set, notification is sent only to this specific user instead of broadcasting */
  user_id?: string;
  /** The user creating the notification (for audit) */
  created_by?: string;
}

/**
 * Server-side notification service.
 * Call this from any API route to create a notification.
 *
 * Examples:
 *   // Broadcast to all students
 *   await createNotification({ title: 'Exam Schedule', message: '...', target_role: 'student', priority: 'high' });
 *
 *   // Send to a specific faculty member
 *   await createNotification({ title: 'New submission', message: '...', target_role: 'faculty', user_id: facultyId });
 *
 *   // Urgent broadcast to everyone
 *   await createNotification({ title: 'Campus Alert', message: '...', priority: 'urgent' });
 */
export async function createNotification(options: CreateNotificationOptions) {
  const {
    title,
    message,
    priority = 'low',
    target_role = 'all',
    user_id = null,
    created_by = null,
  } = options;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title,
      message,
      priority,
      target_role,
      user_id,
      created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }

  return data;
}

/**
 * Create multiple notifications at once.
 */
export async function createNotifications(notifications: CreateNotificationOptions[]) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const rows = notifications.map((n) => ({
    title: n.title,
    message: n.message,
    priority: n.priority || 'low',
    target_role: n.target_role || 'all',
    user_id: n.user_id || null,
    created_by: n.created_by || null,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(rows)
    .select();

  if (error) {
    console.error('Failed to create notifications:', error);
    throw error;
  }

  return data;
}
