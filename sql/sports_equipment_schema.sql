-- Sports equipment: bookable alongside a court reservation
-- Depends on sports_schema.sql + sports_courts_schema.sql
-- Safe to re-run (IF NOT EXISTS + ON CONFLICT).

CREATE TABLE IF NOT EXISTS sport_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (sport_id, name)
);

CREATE TABLE IF NOT EXISTS booking_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES court_bookings(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES sport_equipment(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_sport_equipment_sport ON sport_equipment(sport_id);
CREATE INDEX IF NOT EXISTS idx_sport_equipment_active ON sport_equipment(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_equipment_booking ON booking_equipment(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_equipment_equipment ON booking_equipment(equipment_id);

-- Seed equipment for the 13 facilities (idempotent via UNIQUE(sport_id, name))
INSERT INTO sport_equipment (sport_id, name, total_quantity, description)
SELECT s.id, v.name, v.total_quantity, v.description
FROM (VALUES
  ('Badminton',         'Shuttlecock',        50, 'Feather shuttlecock'),
  ('Badminton',         'Racket',             20, 'Badminton racket'),
  ('Table Tennis',      'TT Ball',            60, 'Table tennis ball'),
  ('Table Tennis',      'Paddle',             30, 'TT paddle'),
  ('Table Tennis',      'Net Set',            10, 'Net + post set'),
  ('Snooker',           'Cue Stick',          10, 'Snooker cue'),
  ('Snooker',           'Ball Set',            4, 'Full snooker ball set'),
  ('Carrom & Chess',    'Carrom Striker',     12, 'Striker'),
  ('Carrom & Chess',    'Carrom Coin Set',    10, 'Full coin set with queen'),
  ('Carrom & Chess',    'Chess Set',          10, 'Board + pieces'),
  ('Carrom & Chess',    'Chess Clock',         6, 'Digital chess clock'),
  ('Volleyball',        'Volleyball',          6, 'Match volleyball'),
  ('Volleyball',        'Net',                 2, 'Volleyball net'),
  ('Basketball',        'Basketball',          8, 'Match basketball'),
  ('Football',          'Football',           10, 'Match football'),
  ('Football',          'Bib Set',             4, '11-bib set for scrimmage'),
  ('Cricket',           'Cricket Bat',         6, 'Willow bat'),
  ('Cricket',           'Cricket Ball',       20, 'Leather ball'),
  ('Cricket',           'Stumps Set',          4, 'Set of 3 stumps + bails'),
  ('Cricket',           'Batting Pads',        6, 'Pair of pads'),
  ('Cricket',           'Batting Gloves',      6, 'Pair of gloves'),
  ('Cricket',           'Helmet',              4, 'Batting helmet'),
  ('Throwball',         'Throwball',           6, 'Match throwball'),
  ('Throwball',         'Net',                 2, 'Throwball net'),
  ('Athletic Track',    'Relay Baton',         8, 'Relay baton'),
  ('Athletic Track',    'Shot Put',            4, 'Shot put ball'),
  ('Athletic Track',    'Javelin',             4, 'Javelin'),
  ('Athletic Track',    'Discus',              4, 'Discus'),
  ('Kabaddi & Kho Kho', 'Kho Kho Pole Set',    2, 'Pole set for Kho Kho'),
  ('Kabaddi & Kho Kho', 'Bib Set',             4, 'Team bib set')
) AS v(sport_name, name, total_quantity, description)
JOIN sports s ON s.name = v.sport_name
ON CONFLICT (sport_id, name) DO NOTHING;
