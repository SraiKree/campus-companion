-- Academic Planning schema.
--
-- Creates `faculty_classes` (if missing) and `class_status` for per-date
-- faculty updates. Missing `class_status` row for a date = "Not Yet Updated".

-- 1. faculty_classes: the table the Faculty Timetable writes into.
-- Shape must match app/api/faculty/classes/route.ts insert payload.
CREATE TABLE IF NOT EXISTS faculty_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  is_lab BOOLEAN DEFAULT FALSE,
  room_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_classes_faculty_id ON faculty_classes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_classes_dept_section ON faculty_classes(department, section);
CREATE INDEX IF NOT EXISTS idx_faculty_classes_weekday ON faculty_classes(weekday);

-- 2. class_status: faculty's per-date update for a scheduled class.
DROP TABLE IF EXISTS class_status CASCADE;

CREATE TABLE class_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES faculty_classes(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'No Class')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, class_date)
);

CREATE INDEX idx_class_status_class_id ON class_status(class_id);
CREATE INDEX idx_class_status_faculty_id ON class_status(faculty_id);
CREATE INDEX idx_class_status_date ON class_status(class_date);
