import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aikpzlzcqqwtlqfxlcer.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vhhr6-GY43cX64B9WnWYUQ_X67z87tG';

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function authenticateUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { id: user.id, role: profile.role as string };
}

// GET - Fetch notifications for the current user
export async function GET(request: Request) {
  try {
    const authedUser = await authenticateUser(request);
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Fetch notifications that target this user's role (or 'all'), or are sent directly to them
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${authedUser.id},user_id.is.null`)
      .or(`target_role.eq.${authedUser.role},target_role.eq.all`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Filter: broadcast notifications must match role, direct notifications must match user
    const filtered = (notifications || []).filter((n) => {
      if (n.user_id) return n.user_id === authedUser.id;
      return n.target_role === authedUser.role || n.target_role === 'all';
    });

    // Mark which ones are read by this user
    const result = filtered.map((n) => ({
      ...n,
      is_read: Array.isArray(n.read_by) && n.read_by.includes(authedUser.id),
    }));

    return NextResponse.json({ notifications: result });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(request: Request) {
  try {
    const authedUser = await authenticateUser(request);
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, priority = 'low', target_role = 'all', user_id = null } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    if (!['student', 'faculty', 'all'].includes(target_role)) {
      return NextResponse.json({ error: 'Invalid target_role' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        priority,
        target_role,
        user_id,
        created_by: authedUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: Request) {
  try {
    const authedUser = await authenticateUser(request);
    if (!authedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    const supabase = getSupabase();

    if (mark_all_read) {
      // Get all unread notifications for this user
      const { data: allNotifs } = await supabase
        .from('notifications')
        .select('id, read_by')
        .or(`user_id.eq.${authedUser.id},user_id.is.null`)
        .or(`target_role.eq.${authedUser.role},target_role.eq.all`);

      const unread = (allNotifs || []).filter((n) => {
        const readBy = Array.isArray(n.read_by) ? n.read_by : [];
        return !readBy.includes(authedUser.id);
      });

      for (const n of unread) {
        const readBy = Array.isArray(n.read_by) ? n.read_by : [];
        await supabase
          .from('notifications')
          .update({ read_by: [...readBy, authedUser.id] })
          .eq('id', n.id);
      }

      return NextResponse.json({ success: true, marked: unread.length });
    }

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json({ error: 'notification_ids array required' }, { status: 400 });
    }

    for (const nid of notification_ids) {
      const { data: notif } = await supabase
        .from('notifications')
        .select('id, read_by')
        .eq('id', nid)
        .single();

      if (notif) {
        const readBy = Array.isArray(notif.read_by) ? notif.read_by : [];
        if (!readBy.includes(authedUser.id)) {
          await supabase
            .from('notifications')
            .update({ read_by: [...readBy, authedUser.id] })
            .eq('id', nid);
        }
      }
    }

    return NextResponse.json({ success: true, marked: notification_ids.length });
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
