# Student Grades System Setup

## Overview
The student grades system provides a comprehensive view of academic performance with the following features:

- **Subject-wise grades and marks display**
- **Semester/term-wise breakdown**
- **GPA/CGPA calculation**
- **Grade distribution visualization**
- **Assignment-wise marks breakdown**
- **Performance analytics and insights**

## Database Schema Requirements

The system expects the following Supabase tables:

### 1. `profiles` table
```sql
- id (uuid, primary key)
- class_name (text) -- Student's class/section
```

### 2. `assignments` table
```sql
- id (text, primary key)
- title (text)
- subject (text)
- subject_code (text, optional)
- total_marks (integer)
- semester (integer, default: 1)
- term (text, optional)
- credits (integer, default: 3)
- class_name (text) -- Which class this assignment belongs to
```

### 3. `assignment_submissions` table
```sql
- assignment_id (text, foreign key)
- student_id (uuid, foreign key)
- marks (integer, nullable) -- null means not graded yet
```

## Features

### 1. Overview Tab
- CGPA and current semester GPA
- GPA trend line chart
- Grade distribution pie chart
- Semester performance summary

### 2. Semester View
- Semester selector
- Subject-wise grades with progress bars
- Grade badges with color coding
- Marks breakdown per subject

### 3. Subject Details
- Detailed view of each subject
- Assignment-wise marks breakdown
- Grade points and credits information
- Performance metrics

### 4. Analytics Tab
- Subject performance comparison charts
- Grade points distribution
- Performance insights (strengths and areas for improvement)

## Grade Calculation

The system uses a 10-point grading scale:
- A+ (90-100%): 10 points
- A (80-89%): 9 points
- B+ (70-79%): 8 points
- B (60-69%): 7 points
- C+ (50-59%): 6 points
- C (40-49%): 5 points
- D (35-39%): 4 points
- F (0-34%): 0 points

## Troubleshooting

### "Row-level security policy" Error

This is the most common error when setting up the grades system. Supabase's Row Level Security (RLS) is preventing data access. Here are the solutions:

#### Option 1: Disable RLS (For Testing Only)
```sql
-- Run these commands in Supabase SQL Editor
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;
```

#### Option 2: Enable Permissive RLS Policies (Recommended)
```sql
-- Enable RLS with permissive policies for testing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (true);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on submissions" ON assignment_submissions FOR ALL USING (true);
```

#### Get Complete SQL Setup
Visit `/api/student/grades/sql` to get all necessary SQL commands for setup.

### Step-by-Step Setup Process

1. **Get SQL Commands**: 
   ```
   GET /api/student/grades/sql
   ```

2. **Create Tables**: Run the CREATE TABLE commands in Supabase SQL Editor

3. **Handle RLS**: Choose Option 1 or 2 above

4. **Insert Sample Data**: Run the sample data SQL commands

5. **Test**: Visit `/api/student/grades?studentId=sample-student-123`

### Database Schema Requirements

The system expects the following Supabase tables:

### 1. `profiles` table
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  class_name text
);
```

### 2. `assignments` table
```sql
CREATE TABLE assignments (
  id text PRIMARY KEY,
  title text,
  subject text,
  subject_code text,
  total_marks integer,
  semester integer DEFAULT 1,
  term text,
  credits integer DEFAULT 3,
  class_name text
);
```

### 3. `assignment_submissions` table
```sql
CREATE TABLE assignment_submissions (
  assignment_id text,
  student_id uuid,
  marks integer,
  PRIMARY KEY (assignment_id, student_id)
);
```

### API Endpoints

### GET `/api/student/grades?studentId={id}`
Fetches all grades data for a student including assignments and submissions.

### GET `/api/student/grades/sql`
Returns SQL commands needed to set up the database tables and sample data.

### GET `/api/student/grades/test`
Tests database connectivity and shows table status for debugging.

### POST `/api/student/grades/test`
Creates minimal test data for debugging purposes.

### POST `/api/student/grades/setup`
Sets up the grades system with comprehensive sample data and verifies database structure.

### POST `/api/student/grades/seed`
Seeds additional sample data for testing (remove in production).

## Usage

1. Navigate to `/student/grades`
2. The system automatically loads the authenticated student's grades
3. Use the tabs to switch between different views
4. Select different semesters using the semester selector
5. View detailed breakdowns in the Subject Details tab

## Testing

## Testing

To test the grades system:

1. **Setup Database**: Make a POST request to `/api/student/grades/setup` to create sample data
2. **Verify User Profile**: Ensure your student profile has `class_name` set to 'CSE-A'
3. **Access Grades**: Navigate to `/student/grades` to view the sample data
4. **Check Console**: If errors occur, check browser console and server logs for detailed error messages

The sample data includes assignments for Semester 1 with various subjects and grades.

## Customization

- Modify the grading scale in `useStudentGrades.ts` `calculateGrade` function
- Adjust colors in the `GRADE_COLORS` constant in the page component
- Add more chart types by importing additional Recharts components
- Customize the UI by modifying the component structure