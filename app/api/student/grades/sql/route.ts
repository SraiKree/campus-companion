import { NextResponse } from 'next/server';

export async function GET() {
  const sqlCommands = {
    createTables: {
      profiles: `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  class_name text,
  created_at timestamp with time zone DEFAULT now()
);`,
      assignments: `
-- Create assignments table  
CREATE TABLE IF NOT EXISTS assignments (
  id text PRIMARY KEY,
  title text NOT NULL,
  subject text NOT NULL,
  subject_code text,
  total_marks integer NOT NULL,
  semester integer DEFAULT 1,
  term text,
  credits integer DEFAULT 3,
  class_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);`,
      submissions: `
-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  assignment_id text REFERENCES assignments(id),
  student_id uuid REFERENCES profiles(id),
  marks integer,
  submitted_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (assignment_id, student_id)
);`
    },
    
    disableRLS: {
      profiles: `
-- Temporarily disable RLS for testing (NOT recommended for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`,
      assignments: `
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;`,
      submissions: `
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;`
    },
    
    sampleData: {
      profile: `
-- Insert sample student profile
INSERT INTO profiles (id, class_name) 
VALUES ('sample-student-123', 'CSE-A') 
ON CONFLICT (id) DO UPDATE SET class_name = 'CSE-A';`,
      
      assignments: `
-- Insert sample assignments
INSERT INTO assignments (id, title, subject, subject_code, total_marks, semester, term, credits, class_name) VALUES
('assign-1', 'Mathematics Assignment 1', 'Mathematics', 'MATH101', 100, 1, 'Semester 1', 4, 'CSE-A'),
('assign-2', 'Physics Lab Report', 'Physics', 'PHY101', 75, 1, 'Semester 1', 3, 'CSE-A'),
('assign-3', 'Programming Project', 'Computer Science', 'CS101', 100, 1, 'Semester 1', 4, 'CSE-A')
ON CONFLICT (id) DO NOTHING;`,
      
      submissions: `
-- Insert sample submissions
INSERT INTO assignment_submissions (assignment_id, student_id, marks) VALUES
('assign-1', 'sample-student-123', 85),
('assign-2', 'sample-student-123', 68),
('assign-3', 'sample-student-123', 92)
ON CONFLICT (assignment_id, student_id) DO UPDATE SET marks = EXCLUDED.marks;`
    },
    
    enableBasicRLS: {
      profiles: `
-- Enable basic RLS that allows all operations (for testing)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);`,
      
      assignments: `
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (true);`,
      
      submissions: `
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on submissions" ON assignment_submissions FOR ALL USING (true);`
    }
  };

  return NextResponse.json({
    message: 'SQL commands for setting up the grades system',
    instructions: [
      '1. Run the CREATE TABLE commands in your Supabase SQL editor',
      '2. Either disable RLS temporarily OR enable basic RLS policies',
      '3. Insert sample data for testing',
      '4. Test the API with the sample student ID: sample-student-123'
    ],
    sqlCommands,
    testEndpoint: '/api/student/grades?studentId=sample-student-123'
  });
}