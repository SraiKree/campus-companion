import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Setting up grades system...');

    // First, let's check if the tables exist by trying to query them
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id, class_name')
      .limit(1);

    if (profilesError) {
      console.error('Profiles table error:', profilesError);
      return NextResponse.json({ 
        error: 'Profiles table not accessible', 
        details: profilesError.message,
        suggestion: 'Please ensure the profiles table exists in Supabase with columns: id (uuid), class_name (text). You may need to create this table first.'
      }, { status: 500 });
    }

    console.log('Profiles table accessible, found records:', profilesTest?.length || 0);

    const { data: assignmentsTest, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id')
      .limit(1);

    if (assignmentsError) {
      console.error('Assignments table error:', assignmentsError);
      return NextResponse.json({ 
        error: 'Assignments table not accessible', 
        details: assignmentsError.message,
        suggestion: 'Please create the assignments table in Supabase'
      }, { status: 500 });
    }

    const { data: submissionsTest, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id')
      .limit(1);

    if (submissionsError) {
      console.error('Assignment submissions table error:', submissionsError);
      return NextResponse.json({ 
        error: 'Assignment submissions table not accessible', 
        details: submissionsError.message,
        suggestion: 'Please create the assignment_submissions table in Supabase'
      }, { status: 500 });
    }

    // If we get here, tables exist. Let's create some sample data
    console.log('Tables exist, creating sample data...');

    // Create a sample profile if none exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!existingProfiles || existingProfiles.length === 0) {
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert([
          { id: 'sample-student-1', class_name: 'CSE-A' }
        ]);

      if (profileInsertError) {
        console.error('Error creating sample profile:', profileInsertError);
      }
    }

    // Sample assignments
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
    ];

    const { error: assignmentsInsertError } = await supabase
      .from('assignments')
      .upsert(sampleAssignments, { onConflict: 'id' });

    if (assignmentsInsertError) {
      console.error('Error inserting assignments:', assignmentsInsertError);
      return NextResponse.json({ 
        error: 'Failed to create sample assignments', 
        details: assignmentsInsertError.message 
      }, { status: 500 });
    }

    // Sample submissions
    const sampleSubmissions = [
      { assignment_id: 'assign-1', student_id: 'sample-student-1', marks: 85 },
      { assignment_id: 'assign-2', student_id: 'sample-student-1', marks: 42 },
      { assignment_id: 'assign-3', student_id: 'sample-student-1', marks: 68 },
      { assignment_id: 'assign-4', student_id: 'sample-student-1', marks: 22 },
      { assignment_id: 'assign-5', student_id: 'sample-student-1', marks: 92 },
    ];

    const { error: submissionsInsertError } = await supabase
      .from('assignment_submissions')
      .upsert(sampleSubmissions, { onConflict: 'assignment_id,student_id' });

    if (submissionsInsertError) {
      console.error('Error inserting submissions:', submissionsInsertError);
      return NextResponse.json({ 
        error: 'Failed to create sample submissions', 
        details: submissionsInsertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Grades system setup completed successfully',
      created: {
        assignments: sampleAssignments.length,
        submissions: sampleSubmissions.length
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}