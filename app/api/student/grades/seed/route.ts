import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Sample data for testing - you can remove this in production
    const sampleAssignments = [
      {
        id: 'assign-1',
        title: 'Mathematics Assignment 1',
        subject: 'Mathematics',
        subject_code: 'MATH101',
        total_marks: 100,
        semester: 1,
        term: 'Semester 1',
        credits: 4,
        class_name: 'CSE-A',
      },
      {
        id: 'assign-2',
        title: 'Mathematics Assignment 2',
        subject: 'Mathematics',
        subject_code: 'MATH101',
        total_marks: 50,
        semester: 1,
        term: 'Semester 1',
        credits: 4,
        class_name: 'CSE-A',
      },
      {
        id: 'assign-3',
        title: 'Physics Lab Report',
        subject: 'Physics',
        subject_code: 'PHY101',
        total_marks: 75,
        semester: 1,
        term: 'Semester 1',
        credits: 3,
        class_name: 'CSE-A',
      },
      {
        id: 'assign-4',
        title: 'Chemistry Quiz',
        subject: 'Chemistry',
        subject_code: 'CHEM101',
        total_marks: 25,
        semester: 1,
        term: 'Semester 1',
        credits: 3,
        class_name: 'CSE-A',
      },
      {
        id: 'assign-5',
        title: 'Programming Assignment',
        subject: 'Computer Science',
        subject_code: 'CS101',
        total_marks: 100,
        semester: 1,
        term: 'Semester 1',
        credits: 4,
        class_name: 'CSE-A',
      },
      // Semester 2 assignments
      {
        id: 'assign-6',
        title: 'Advanced Math Test',
        subject: 'Advanced Mathematics',
        subject_code: 'MATH201',
        total_marks: 100,
        semester: 2,
        term: 'Semester 2',
        credits: 4,
        class_name: 'CSE-A',
      },
      {
        id: 'assign-7',
        title: 'Data Structures Project',
        subject: 'Data Structures',
        subject_code: 'CS201',
        total_marks: 150,
        semester: 2,
        term: 'Semester 2',
        credits: 4,
        class_name: 'CSE-A',
      },
    ];

    const sampleSubmissions = [
      { assignment_id: 'assign-1', student_id: 'student-1', marks: 85 },
      { assignment_id: 'assign-2', student_id: 'student-1', marks: 42 },
      { assignment_id: 'assign-3', student_id: 'student-1', marks: 68 },
      { assignment_id: 'assign-4', student_id: 'student-1', marks: 22 },
      { assignment_id: 'assign-5', student_id: 'student-1', marks: 92 },
      { assignment_id: 'assign-6', student_id: 'student-1', marks: 78 },
      { assignment_id: 'assign-7', student_id: 'student-1', marks: 135 },
    ];

    // Insert sample assignments (if they don't exist)
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .upsert(sampleAssignments, { onConflict: 'id' });

    if (assignmentsError) {
      console.error('Error inserting assignments:', assignmentsError);
    }

    // Insert sample submissions (if they don't exist)
    const { error: submissionsError } = await supabase
      .from('assignment_submissions')
      .upsert(sampleSubmissions, { onConflict: 'assignment_id,student_id' });

    if (submissionsError) {
      console.error('Error inserting submissions:', submissionsError);
    }

    return NextResponse.json({ 
      message: 'Sample data seeded successfully',
      assignments: sampleAssignments.length,
      submissions: sampleSubmissions.length
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}