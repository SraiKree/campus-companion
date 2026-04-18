-- Courts & bookings for the Sports module
-- Additive to sports_schema.sql (does NOT drop existing sports tables)

DROP TABLE IF EXISTS court_bookings CASCADE;
DROP TABLE IF EXISTS sport_courts CASCADE;

CREATE TABLE sport_courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER,
  description TEXT,
  opens_at TIME DEFAULT '06:00:00',
  closes_at TIME DEFAULT '21:00:00',
  slot_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE court_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES sport_courts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_roll_number TEXT,
  student_department TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_slot CHECK (end_time > start_time)
);

CREATE INDEX idx_sport_courts_sport ON sport_courts(sport_id);
CREATE INDEX idx_sport_courts_active ON sport_courts(is_active);
CREATE INDEX idx_court_bookings_court_date ON court_bookings(court_id, booking_date);
CREATE INDEX idx_court_bookings_student ON court_bookings(student_id);
CREATE INDEX idx_court_bookings_status ON court_bookings(status);

-- Prevent overlapping active bookings on the same court
CREATE UNIQUE INDEX uniq_court_slot_active ON court_bookings (court_id, booking_date, start_time, end_time)
  WHERE status IN ('Pending', 'Confirmed');

-- Seed a few sample courts (only if sports exist)
INSERT INTO sport_courts (sport_id, name, location, capacity, description, opens_at, closes_at, slot_minutes)
SELECT id, name || ' Court A', venue, 10, 'Open for student booking', '06:00'::time, '21:00'::time, 60
FROM sports
WHERE category IN ('Basketball', 'Badminton', 'Indoor Games', 'Cricket', 'Football')
ON CONFLICT DO NOTHING;
