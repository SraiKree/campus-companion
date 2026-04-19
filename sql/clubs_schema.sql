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

-- Seed sample clubs (user_id NULL — link after creating the auth user)
INSERT INTO clubs (name, description, advisor_name, contact_email) VALUES
  ('Coding Club',      'Competitive programming, hackathons, open-source.', 'Prof. A. Sharma', 'coding@mlrit.ac.in'),
  ('Dance Club',       'Classical & contemporary dance troupe.',            'Prof. R. Mehta',   'dance@mlrit.ac.in'),
  ('Literary Club',    'Debate, creative writing, literary magazine.',      'Prof. S. Iyer',    'literary@mlrit.ac.in'),
  ('Photography Club', 'Campus photography, photo walks, exhibitions.',     'Prof. K. Rao',     'photo@mlrit.ac.in')
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
