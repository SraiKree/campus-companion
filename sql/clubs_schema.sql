-- Clubs module: per-club login account + announcements/events/members
-- Safe to re-run (IF NOT EXISTS + ON CONFLICT DO NOTHING).

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  advisor_name TEXT,
  contact_email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  student_name TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (club_id, roll_number)
);

CREATE TABLE IF NOT EXISTS club_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  venue TEXT,
  eligibility TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Upcoming'
    CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubs_user ON clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_announcements_club ON club_announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_club ON club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_date ON club_events(event_date);

-- Seed clubs (user_id NULL — populated by scripts/seed-club-users.ts)
INSERT INTO clubs (name, contact_email) VALUES
  ('Came Club',      'came@mlrit.ac.in'),
  ('Club Lit',       'lit@mlrit.ac.in'),
  ('CIE Club',       'cie@mlrit.ac.in'),
  ('Apex',           'apex@mlrit.ac.in'),
  ('Scope',          'scope@mlrit.ac.in'),
  ('EWB',            'ewb@mlrit.ac.in'),
  ('NSS',            'nss@mlrit.ac.in'),
  ('Code Club',      'code@mlrit.ac.in'),
  ('Aim Club',       'aim@mlrit.ac.in'),
  ('MECH Club',      'mech@mlrit.ac.in'),
  ('Robotics Club',  'robotics@mlrit.ac.in'),
  ('Squad Club',     'squad@mlrit.ac.in'),
  ('IT Club',        'it@mlrit.ac.in')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- To enable login for a club, do these steps for each club you want live:
--
-- 1. In Supabase dashboard → Authentication → Add user:
--       email:    <club>@mlrit.ac.in
--       password: <something secure>
--       user_metadata: {"role": "club"}
--
-- 2. Insert the role into user_roles (replace <uuid> with the new user's id):
--       INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'club');
--
-- 3. Link the auth user to the club record:
--       UPDATE clubs SET user_id = '<uuid>' WHERE name = 'Coding Club';
-- ============================================================================
