-- ================================================================
-- HOSTEL MODULE SCHEMA
-- Run this in Supabase SQL editor. Safe to re-run (uses IF NOT EXISTS).
-- ================================================================

-- 1. Extend students25 with hostel fields ------------------------------------
ALTER TABLE students25
  ADD COLUMN IF NOT EXISTS is_hosteller BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE students25
  ADD COLUMN IF NOT EXISTS hostel_status TEXT NOT NULL DEFAULT 'active'
    CHECK (hostel_status IN ('active', 'left'));

ALTER TABLE students25
  ADD COLUMN IF NOT EXISTS hostel_left_at TIMESTAMPTZ;

-- 2. Rooms --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no    TEXT NOT NULL,
  block      TEXT NOT NULL,
  capacity   INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (block, room_no)
);

-- 3. Allocations (history-aware: one row per stay) ---------------------------
CREATE TABLE IF NOT EXISTS hostel_allocations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_roll   TEXT NOT NULL,          -- matches students25.roll_number
  room_id        UUID NOT NULL REFERENCES hostel_rooms(id) ON DELETE RESTRICT,
  allocated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vacated_at     TIMESTAMPTZ,
  is_current     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_hostel_alloc_roll    ON hostel_allocations (student_roll);
CREATE INDEX IF NOT EXISTS idx_hostel_alloc_current ON hostel_allocations (is_current);

-- Only one "current" allocation per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_hostel_alloc_one_current
  ON hostel_allocations (student_roll)
  WHERE is_current = TRUE;

-- 4. Hostel admins (separate auth from student/faculty) ----------------------
CREATE TABLE IF NOT EXISTS hostel_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,           -- plain for now to mirror students25 default-password pattern
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'warden' CHECK (role IN ('warden', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Mess menu (weekly, one row per day) -------------------------------------
CREATE TABLE IF NOT EXISTS mess_menu (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL UNIQUE
    CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  breakfast  TEXT,
  lunch      TEXT,
  snacks     TEXT,
  dinner     TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- SEED DATA (safe-insert; skip if already present)
-- ================================================================

-- Rooms: 2 blocks, 3 rooms each
INSERT INTO hostel_rooms (block, room_no, capacity) VALUES
  ('A', '101', 3), ('A', '102', 3), ('A', '103', 3),
  ('B', '201', 3), ('B', '202', 3), ('B', '203', 3)
ON CONFLICT (block, room_no) DO NOTHING;

-- NOTE: hostel_admins has NO seeded credentials.
-- Insert a row manually when real warden credentials are available, e.g.:
--   INSERT INTO hostel_admins (email, password, name, role)
--     VALUES ('<email>', '<password>', '<name>', 'warden');

-- Weekly mess menu
INSERT INTO mess_menu (day_of_week, breakfast, lunch, snacks, dinner) VALUES
  ('Monday',    'Idli, Sambar, Chutney',      'Rice, Dal, Aloo Curry, Curd',     'Samosa, Tea',     'Chapati, Paneer Butter Masala, Rice'),
  ('Tuesday',   'Poha, Boiled Egg',           'Rice, Rajma, Jeera Aloo, Salad',  'Vada Pav, Coffee','Chapati, Chicken Curry, Rice'),
  ('Wednesday', 'Upma, Coconut Chutney',      'Rice, Sambar, Bhindi Fry, Curd',  'Pakora, Tea',     'Chapati, Egg Curry, Rice'),
  ('Thursday',  'Dosa, Chutney, Sambar',      'Pulao, Dal, Cabbage Curry',       'Bread Pakora',    'Chapati, Dal Makhani, Rice'),
  ('Friday',    'Paratha, Curd, Pickle',      'Rice, Dal, Mix Veg, Papad',       'Bhel Puri, Tea',  'Chapati, Chole, Jeera Rice'),
  ('Saturday',  'Puri, Aloo Sabzi',           'Veg Biryani, Raita, Salad',       'Pasta, Juice',    'Chapati, Paneer Tikka, Rice'),
  ('Sunday',    'Masala Dosa, Sambar',        'Chicken Biryani / Veg Biryani',   'Ice Cream',       'Chapati, Malai Kofta, Rice')
ON CONFLICT (day_of_week) DO NOTHING;

-- ================================================================
-- DEMO: mark a couple of students as hostellers & allocate rooms.
-- Edit roll numbers below to match real rows in students25 before running.
-- ================================================================
-- UPDATE students25 SET is_hosteller = TRUE WHERE roll_number IN ('24R01A0501', '24R01A0502');
-- INSERT INTO hostel_allocations (student_roll, room_id)
--   SELECT '24R01A0501', id FROM hostel_rooms WHERE block = 'A' AND room_no = '101';
-- INSERT INTO hostel_allocations (student_roll, room_id)
--   SELECT '24R01A0502', id FROM hostel_rooms WHERE block = 'A' AND room_no = '101';
