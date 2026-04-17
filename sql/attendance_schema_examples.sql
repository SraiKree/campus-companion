-- ATTENDANCE MANAGEMENT SYSTEM - EXAMPLE QUERIES
-- ================================================

-- 1. Calculate attendance percentage per student per subject
-- This query shows each student's attendance percentage for each subject
SELECT 
    student_roll_number,
    student_name,
    section,
    subject_name,
    subject_code,
    total_classes,
    classes_attended,
    attendance_percentage
FROM student_attendance_summary
WHERE student_roll_number = '21CSE001'  -- Replace with actual roll number
ORDER BY subject_name;

-- 2. Retrieve a student's attendance history across multiple semesters
-- This uses the function we created for date range queries
SELECT * FROM get_student_attendance_by_date_range(
    '21CSE001',  -- Replace with actual roll number
    '2024-01-01',
    '2024-12-31'
);

-- 3. Faculty quick attendance marking for a section and period
-- First, get the timetable entry for today's class
SELECT 
    t.id as timetable_id,
    sub.subject_name,
    f.name as faculty_name,
    t.section_name,
    t.weekday,
    t.period_number
FROM timetable t
JOIN subjects sub ON t.subject_id = sub.id
JOIN faculty f ON t.faculty_id = f.id
WHERE t.section_name = 'CSE-A'
AND t.weekday = EXTRACT(DOW FROM CURRENT_DATE) -- Today's weekday
AND t.period_number = 1; -- First period

-- Create attendance session for today (if not exists)
INSERT INTO attendance_sessions (timetable_id, date)
SELECT t.id, CURRENT_DATE
FROM timetable t
WHERE t.section_name = 'CSE-A'
AND t.weekday = EXTRACT(DOW FROM CURRENT_DATE)
AND t.period_number = 1
ON CONFLICT (timetable_id, date) DO NOTHING;

-- Bulk insert attendance records for all students in the section
INSERT INTO attendance_records (session_id, student_roll_number, status)
SELECT 
    ats.id,
    s.roll_number,
    'present'::attendance_status_enum  -- Default to present, can be updated
FROM attendance_sessions ats
JOIN timetable t ON ats.timetable_id = t.id
CROSS JOIN students25 s
WHERE t.section_name = 'CSE-A'
AND s.section = 'CSE-A'
AND ats.date = CURRENT_DATE
AND t.weekday = EXTRACT(DOW FROM CURRENT_DATE)
AND t.period_number = 1
ON CONFLICT (session_id, student_roll_number) DO NOTHING;

-- 4. Identify students below required attendance percentage (75%)
SELECT 
    student_roll_number,
    student_name,
    section,
    subject_name,
    attendance_percentage
FROM student_attendance_summary
WHERE attendance_percentage < 75.0
ORDER BY attendance_percentage ASC;

-- 5. Fetch attendance for a section on a given date
SELECT 
    s.roll_number,
    s.name as student_name,
    sub.subject_name,
    sub.subject_code,
    f.name as faculty_name,
    t.period_number,
    COALESCE(ar.status::TEXT, 'not_marked') as attendance_status
FROM students25 s
CROSS JOIN timetable t
JOIN subjects sub ON t.subject_id = sub.id
JOIN faculty f ON t.faculty_id = f.id
LEFT JOIN attendance_sessions ats ON (
    ats.timetable_id = t.id 
    AND ats.date = '2024-03-14'  -- Replace with desired date
)
LEFT JOIN attendance_records ar ON (
    ar.session_id = ats.id 
    AND ar.student_roll_number = s.roll_number
)
WHERE s.section = 'CSE-A'  -- Replace with desired section
AND t.section_name = 'CSE-A'
AND t.weekday = EXTRACT(DOW FROM DATE '2024-03-14')  -- Weekday of the date
ORDER BY s.roll_number, t.period_number;

-- 6. Get overall attendance statistics for a department
SELECT 
    section,
    COUNT(DISTINCT student_roll_number) as total_students,
    AVG(attendance_percentage) as avg_attendance_percentage,
    COUNT(CASE WHEN attendance_percentage < 75 THEN 1 END) as students_below_75_percent
FROM student_attendance_summary
WHERE department = 'CSE'
GROUP BY section
ORDER BY section;

-- 7. Get subject-wise attendance for a specific section
SELECT 
    subject_name,
    subject_code,
    COUNT(DISTINCT student_roll_number) as students_enrolled,
    AVG(attendance_percentage) as avg_attendance,
    MIN(attendance_percentage) as min_attendance,
    MAX(attendance_percentage) as max_attendance
FROM student_attendance_summary
WHERE section = 'CSE-A'
GROUP BY subject_name, subject_code
ORDER BY subject_name;

-- 8. Monthly attendance report for a student
SELECT 
    DATE_TRUNC('month', ats.date) as month,
    sub.subject_name,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as classes_attended,
    ROUND(
        (COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as monthly_attendance_percentage
FROM attendance_records ar
JOIN attendance_sessions ats ON ar.session_id = ats.id
JOIN timetable t ON ats.timetable_id = t.id
JOIN subjects sub ON t.subject_id = sub.id
WHERE ar.student_roll_number = '21CSE001'  -- Replace with actual roll number
AND ats.date >= DATE_TRUNC('year', CURRENT_DATE)  -- Current academic year
GROUP BY DATE_TRUNC('month', ats.date), sub.subject_name
ORDER BY month, sub.subject_name;

-- 9. Faculty workload - classes per faculty per day
SELECT 
    f.name as faculty_name,
    f.department,
    t.weekday,
    COUNT(*) as classes_per_day,
    STRING_AGG(DISTINCT t.section_name, ', ') as sections_taught
FROM faculty f
JOIN timetable t ON f.id = t.faculty_id
GROUP BY f.name, f.department, t.weekday
ORDER BY f.name, t.weekday;

-- 10. Performance optimization query - attendance with proper indexing
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    ar.student_roll_number,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as attended_classes
FROM attendance_records ar
JOIN attendance_sessions ats ON ar.session_id = ats.id
WHERE ats.date BETWEEN '2024-01-01' AND '2024-12-31'
AND ar.student_roll_number IN (
    SELECT roll_number FROM students25 WHERE section = 'CSE-A'
)
GROUP BY ar.student_roll_number;