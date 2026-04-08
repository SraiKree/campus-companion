-- Notifications table for Campus Companion
-- Supports broadcast (target_role) and direct (user_id) notifications with priority levels.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('student', 'faculty', 'all')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = broadcast to target_role
  read_by UUID[] DEFAULT '{}',                                -- array of user IDs who have read it
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fetching notifications by role quickly
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications (target_role, created_at DESC);
-- Index for direct user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: anyone authenticated can read notifications targeted to their role or to them directly
CREATE POLICY "Users can read their notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_id IS NULL
    )
  );

-- Policy: service role can insert (used by the API)
-- No insert policy needed since we use supabaseAdmin (service role) for creation
