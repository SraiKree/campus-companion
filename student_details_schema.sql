-- Student extended details table
-- Stores personal, family, category, contact, and ID document information.

CREATE TABLE IF NOT EXISTS student_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Personal Information
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  department TEXT NOT NULL,
  nature_of_work TEXT NOT NULL,
  designation TEXT NOT NULL,
  date_of_birth DATE NOT NULL,

  -- Step 2: Family Details
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  religion TEXT NOT NULL,
  caste TEXT NOT NULL,

  -- Step 3: Category Details
  category TEXT NOT NULL,
  category_telangana TEXT NOT NULL,
  special_category TEXT NOT NULL,

  -- Step 4: Contact Details
  permanent_address TEXT NOT NULL,
  communication_address TEXT NOT NULL,
  mobile_no TEXT NOT NULL,
  email_address TEXT NOT NULL,

  -- Step 5: ID Documents
  pan_no TEXT NOT NULL,
  aadhar_no TEXT NOT NULL,
  apaar_id TEXT,          -- optional
  abha_no TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_details_user_id ON student_details (user_id);

ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own details"
  ON student_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own details"
  ON student_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own details"
  ON student_details FOR UPDATE
  USING (auth.uid() = user_id);
