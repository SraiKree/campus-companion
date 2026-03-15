import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch grades for a class and exam type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const examType = searchParams.get('examType');

    if (!classId || !examType) {
      return NextResponse.json(
        { error: 'Class ID and exam type are required' },
        { status: 400 }
      );
    }

    // Fetch grades for the specific class and exam type
    const { data: grades, error } = await supabaseAdmin
      .from('student_grades_detailed')
      .select('*')
      .eq('faculty_class_id', classId)
      .eq('exam_type', examType)
      .order('student_roll_number');

    if (error) {
      console.error('Error fetching grades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      grades: grades || [],
      count: grades?.length || 0
    });

  } catch (error) {
    console.error('Grades API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update a grade
export async function POST(request: NextRequest) {
  try {
    const {
      classId,
      studentRollNumber,
      examType,
      examMarks,
      assignmentMarks,
      otherMarks,
      academicYear,
      semester
    } = await request.json();

    if (!classId || !studentRollNumber || !examType || !academicYear || !semester) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate marks
    if (examMarks < 0 || examMarks > 30) {
      return NextResponse.json(
        { error: 'Exam marks must be between 0 and 30' },
        { status: 400 }
      );
    }

    if (assignmentMarks < 0 || assignmentMarks > 5) {
      return NextResponse.json(
        { error: 'Assignment marks must be between 0 and 5' },
        { status: 400 }
      );
    }

    if (otherMarks < 0 || otherMarks > 5) {
      return NextResponse.json(
        { error: 'Other marks must be between 0 and 5' },
        { status: 400 }
      );
    }

    // Check if grade already exists
    const { data: existingGrade } = await supabaseAdmin
      .from('student_grades')
      .select('id')
      .eq('student_roll_number', studentRollNumber)
      .eq('faculty_class_id', classId)
      .eq('exam_type', examType)
      .single();

    if (existingGrade) {
      // Update existing grade
      const { data: updatedGrade, error: updateError } = await supabaseAdmin
        .from('student_grades')
        .update({
          exam_marks: examMarks,
          assignment_marks: assignmentMarks,
          other_marks: otherMarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGrade.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating grade:', updateError);
        return NextResponse.json(
          { error: 'Failed to update grade' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Grade updated successfully',
        grade: updatedGrade
      });
    } else {
      // Create new grade
      const { data: newGrade, error: insertError } = await supabaseAdmin
        .from('student_grades')
        .insert({
          student_roll_number: studentRollNumber,
          faculty_class_id: classId,
          academic_year: academicYear,
          semester: semester,
          exam_type: examType,
          exam_marks: examMarks,
          assignment_marks: assignmentMarks,
          other_marks: otherMarks
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating grade:', insertError);
        return NextResponse.json(
          { error: 'Failed to create grade' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Grade created successfully',
        grade: newGrade
      });
    }

  } catch (error) {
    console.error('Create/Update grade API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a grade
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');

    if (!gradeId) {
      return NextResponse.json(
        { error: 'Grade ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('student_grades')
      .delete()
      .eq('id', gradeId);

    if (error) {
      console.error('Error deleting grade:', error);
      return NextResponse.json(
        { error: 'Failed to delete grade' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Grade deleted successfully'
    });

  } catch (error) {
    console.error('Delete grade API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}