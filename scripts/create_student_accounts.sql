-- Script to create Supabase auth accounts for all students
-- This should be run after the authentication system update

-- First, let's see how many students we have
SELECT COUNT(*) as total_students FROM students25;

-- Check for students with valid emails
SELECT COUNT(*) as students_with_email 
FROM students25 
WHERE email IS NOT NULL AND email != '' AND email LIKE '%@%';

-- Sample of students data
SELECT roll_number, name, email, department, section 
FROM students25 
WHERE email IS NOT NULL AND email != '' 
LIMIT 10;

-- Note: The actual account creation will be handled by the login API
-- when students first log in. This script is for verification only.