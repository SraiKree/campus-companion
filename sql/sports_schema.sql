-- Sports & Activities module schema
-- Tables: sports, sport_events, sport_registrations, sport_teams, sport_team_members, sport_achievements

DROP TABLE IF EXISTS sport_achievements CASCADE;
DROP TABLE IF EXISTS sport_team_members CASCADE;
DROP TABLE IF EXISTS sport_teams CASCADE;
DROP TABLE IF EXISTS sport_registrations CASCADE;
DROP TABLE IF EXISTS sport_events CASCADE;
DROP TABLE IF EXISTS sports CASCADE;

CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Cricket', 'Football', 'Basketball', 'Badminton', 'Athletics', 'Indoor Games')),
  coach TEXT,
  coach_email TEXT,
  schedule TEXT,
  venue TEXT,
  description TEXT,
  icon TEXT DEFAULT 'Trophy',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sport_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  venue TEXT,
  eligibility TEXT,
  registration_deadline TIMESTAMPTZ,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  winner TEXT,
  runner_up TEXT,
  third_place TEXT,
  results_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sport_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sport_events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_roll_number TEXT,
  student_department TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

CREATE TABLE sport_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_name TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sport_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES sport_teams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_roll_number TEXT,
  position TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, student_id)
);

CREATE TABLE sport_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES sport_events(id) ON DELETE SET NULL,
  sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  position TEXT CHECK (position IN ('Winner', 'Runner-up', 'Third Place', 'Participant', 'Special Mention')),
  description TEXT,
  certificate_url TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_sports_category ON sports(category);
CREATE INDEX idx_sports_active ON sports(is_active);
CREATE INDEX idx_sport_events_sport ON sport_events(sport_id);
CREATE INDEX idx_sport_events_date ON sport_events(event_date);
CREATE INDEX idx_sport_events_status ON sport_events(status);
CREATE INDEX idx_sport_registrations_event ON sport_registrations(event_id);
CREATE INDEX idx_sport_registrations_student ON sport_registrations(student_id);
CREATE INDEX idx_sport_registrations_status ON sport_registrations(status);
CREATE INDEX idx_sport_team_members_team ON sport_team_members(team_id);
CREATE INDEX idx_sport_team_members_student ON sport_team_members(student_id);
CREATE INDEX idx_sport_achievements_student ON sport_achievements(student_id);

-- Seed default sports
INSERT INTO sports (name, category, coach, schedule, venue, description, icon) VALUES
  ('Cricket', 'Cricket', 'Coach Ramesh', 'Mon/Wed/Fri 5:00 PM - 7:00 PM', 'Main Ground', 'College cricket team — participate in inter-college tournaments.', 'Target'),
  ('Football', 'Football', 'Coach Anil', 'Tue/Thu/Sat 5:00 PM - 7:00 PM', 'Football Ground', 'Campus football team — train for state-level championships.', 'CircleDot'),
  ('Basketball', 'Basketball', 'Coach Priya', 'Mon/Wed/Fri 6:00 AM - 8:00 AM', 'Indoor Court', 'Basketball team — fast, competitive, and fun.', 'Dribbble'),
  ('Badminton', 'Badminton', 'Coach Sunita', 'Daily 4:00 PM - 6:00 PM', 'Badminton Court', 'Singles and doubles training, open to all skill levels.', 'Activity'),
  ('Athletics', 'Athletics', 'Coach Vikram', 'Daily 6:00 AM - 8:00 AM', 'Track & Field', 'Track, field, and long-distance running.', 'Zap'),
  ('Chess', 'Indoor Games', 'Coach Meera', 'Mon/Wed 4:00 PM - 6:00 PM', 'Indoor Games Room', 'Chess club — tournaments and weekly practice.', 'Brain'),
  ('Table Tennis', 'Indoor Games', 'Coach Arjun', 'Tue/Thu 4:00 PM - 6:00 PM', 'Indoor Games Room', 'Fast-paced table tennis training and matches.', 'TableProperties')
ON CONFLICT (name) DO NOTHING;
