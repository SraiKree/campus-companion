-- Sports booking upgrade: 13 facilities, 3–6 PM slots, player tracking
-- Additive to sports_schema.sql + sports_courts_schema.sql
-- Safe to re-run.

-- 1. Expand sports.category CHECK to cover new facilities
ALTER TABLE sports DROP CONSTRAINT IF EXISTS sports_category_check;
ALTER TABLE sports ADD CONSTRAINT sports_category_check
  CHECK (category IN (
    'Cricket', 'Football', 'Basketball', 'Badminton',
    'Athletics', 'Indoor Games',
    'Volleyball', 'Kabaddi', 'Throwball', 'Gymnasium'
  ));

-- 2. Per-court max_players
ALTER TABLE sport_courts ADD COLUMN IF NOT EXISTS max_players INTEGER;
UPDATE sport_courts SET max_players = 4 WHERE max_players IS NULL;
ALTER TABLE sport_courts ALTER COLUMN max_players SET DEFAULT 4;
ALTER TABLE sport_courts ALTER COLUMN max_players SET NOT NULL;

-- 3. Per-booking teammate roster
CREATE TABLE IF NOT EXISTS court_booking_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES court_bookings(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  player_name TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, roll_number)
);
CREATE INDEX IF NOT EXISTS idx_court_booking_players_booking
  ON court_booking_players(booking_id);

-- 4. Seed the 13 spec sports (existing ones untouched via ON CONFLICT)
INSERT INTO sports (name, category, venue, description, icon) VALUES
  ('Badminton',         'Badminton',    'Indoor Hall',      'Indoor badminton courts.',           'Activity'),
  ('Table Tennis',      'Indoor Games', 'Indoor Hall',      'Table tennis tables.',               'TableProperties'),
  ('Gymnasium',         'Gymnasium',    'Gym Block',        'Fitness & strength training.',       'Flame'),
  ('Snooker',           'Indoor Games', 'Indoor Hall',      'Snooker tables.',                    'Target'),
  ('Carrom & Chess',    'Indoor Games', 'Indoor Hall',      'Carrom boards and chess boards.',    'Brain'),
  ('Volleyball',        'Volleyball',   'Outdoor Courts',   'Volleyball courts.',                 'CircleDot'),
  ('Basketball',        'Basketball',   'Outdoor Court',    'Basketball court.',                  'Dribbble'),
  ('Football',          'Football',     'Football Ground',  'Football ground.',                   'CircleDot'),
  ('Cricket',           'Cricket',      'Cricket Ground',   'Cricket ground.',                    'Target'),
  ('Kabaddi & Kho Kho', 'Kabaddi',      'Outdoor Courts',   'Kabaddi & Kho Kho courts.',          'Zap'),
  ('Throwball',         'Throwball',    'Outdoor Ground',   'Throwball ground.',                  'CircleDot'),
  ('Athletic Track',    'Athletics',    'Athletic Track',   '400m athletic track.',               'Zap')
ON CONFLICT (name) DO NOTHING;

-- 5. Replace court seeds for the 13 facilities (leaves manually-added rows alone)
DELETE FROM sport_courts
WHERE sport_id IN (
  SELECT id FROM sports WHERE name IN (
    'Badminton','Table Tennis','Gymnasium','Snooker','Carrom & Chess',
    'Volleyball','Basketball','Football','Cricket',
    'Kabaddi & Kho Kho','Throwball','Athletic Track'
  )
);

DO $$
DECLARE
  facility RECORD;
  i INT;
BEGIN
  FOR facility IN
    SELECT * FROM (VALUES
      ('Badminton',         'Court',  10, 4,  'Indoor Hall'),
      ('Table Tennis',      'Table',  20, 4,  'Indoor Hall'),
      ('Gymnasium',         'Session', 1, 1,  'Gym Block'),
      ('Snooker',           'Table',   4, 4,  'Indoor Hall'),
      ('Carrom & Chess',    'Board',   6, 4,  'Indoor Hall'),
      ('Volleyball',        'Court',   2, 12, 'Outdoor Courts'),
      ('Basketball',        'Court',   1, 10, 'Outdoor Court'),
      ('Football',          'Ground',  1, 22, 'Football Ground'),
      ('Cricket',           'Ground',  1, 22, 'Cricket Ground'),
      ('Kabaddi & Kho Kho', 'Court',   2, 14, 'Outdoor Courts'),
      ('Throwball',         'Ground',  1, 14, 'Outdoor Ground'),
      ('Athletic Track',    'Track',   1, 8,  'Athletic Track')
    ) AS t(sport_name, unit, unit_count, max_players, location)
  LOOP
    FOR i IN 1..facility.unit_count LOOP
      INSERT INTO sport_courts (
        sport_id, name, location, capacity, max_players, description,
        opens_at, closes_at, slot_minutes, is_active
      )
      SELECT
        s.id,
        CASE WHEN facility.unit_count = 1
             THEN facility.sport_name
             ELSE facility.sport_name || ' ' || facility.unit || ' ' || i
        END,
        facility.location,
        facility.max_players,
        facility.max_players,
        'Open for student booking 3:00 PM – 6:00 PM',
        '15:00'::time, '18:00'::time, 60, TRUE
      FROM sports s
      WHERE s.name = facility.sport_name;
    END LOOP;
  END LOOP;
END $$;
