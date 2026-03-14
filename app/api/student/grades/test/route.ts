import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        suggestion: 'Check if the profiles table exists in your Supabase database'
      });
    }

    // Test assignments table
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);

    // Test submissions table
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      tables: {
        profiles: {
          accessible: !testError,
          count: testData?.length || 0,
          sample: testData?.[0] || null,
          error: testError?.message || null
        },
        assignments: {
          accessible: !assignmentsError,
          count: assignmentsData?.length || 0,
          sample: assignmentsData?.[0] || null,
          error: assignmentsError?.message || null
        },
        assignment_submissions: {
          accessible: !submissionsError,
          count: submissionsData?.length || 0,
          sample: submissionsData?.[0] || null,
          error: submissionsError?.message || null
        }
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST() {
  try {
    console.log('Creating minimal test data...');

    // Create a simple test profile using service role if possible
    const testStudentId = 'test-student-123';
    
    // Try to insert without RLS constraints by using upsert
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([
        { id: testStudentId, class_name: 'TEST-CLASS' }
      ], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test profile - RLS may be blocking this',
        details: profileError.message,
        suggestion: 'You may need to temporarily disable RLS on the profiles table or manually insert a profile record',
        sqlCommand: `INSERT INTO profiles (id, class_name) VALUES ('${testStudentId}', 'TEST-CLASS') ON CONFLICT (id) DO UPDATE SET class_name = 'TEST-CLASS';`
      });
    }

    // Create simple test assignments
    const testAssignments = [
      {
        id: 'test-assign-1',
        title: 'Test Assignment 1',
        subject: 'Test Subject',
        subject_code: 'TEST101',
        total_marks: 100,
        semester: 1,
        term: 'Test Term',
        credits: 3,
        class_name: 'TEST-CLASS'
      }
    ];

    const { error: assignmentError } = await supabase
      .from('assignments')
      .upsert(testAssignments, { onConflict: 'id' });

    if (assignmentError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test assignments',
        details: assignmentError.message,
        suggestion: 'Check if the assignments table exists and has proper permissions'
      });
    }

    // Create test submission
    const { error: submissionError } = await supabase
      .from('assignment_submissions')
      .upsert([
        { assignment_id: 'test-assign-1', student_id: testStudentId, marks: 85 }
      ], { onConflict: 'assignment_id,student_id' });

    if (submissionError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test submission',
        details: submissionError.message,
        suggestion: 'Check if the assignment_submissions table exists and has proper permissions'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      testStudentId,
      testUrl: `/api/student/grades?studentId=${testStudentId}`,
      note: 'Use this student ID to test the grades system'
    });

  } catch (error) {
    console.error('Test creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during test creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}