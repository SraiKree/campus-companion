import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rollNumber = searchParams.get('rollNumber');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');

    if (!rollNumber) {
      return NextResponse.json(
        { error: 'Roll number is required' },
        { status: 400 }
      );
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students25')
      .select('*')
      .eq('roll_number', rollNumber)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Build query for faculty classes that match the student's department, section, year, and semester
    let classQuery = supabaseAdmin
      .from('faculty_classes')
      .select('*')
      .eq('department', student.department)
      .eq('section', student.section);

    // Add academic year and semester filters if provided, otherwise use student's current year/semester
    if (academicYear) {
      classQuery = classQuery.eq('academic_year', academicYear);
    } else {
      classQuery = classQuery.eq('academic_year', student.year);
    }

    if (semester) {
      classQuery = classQuery.eq('semester', semester);
    } else {
      classQuery = classQuery.eq('semester', student.semester);
    }

    const { data: facultyClasses, error: classError } = await classQuery;

    if (classError) {
      console.error('Error fetching faculty classes:', classError);
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    if (!facultyClasses || facultyClasses.length === 0) {
      return NextResponse.json({
        subjects: [],
        message: 'No classes found for this student'
      });
    }

    // Get grades for all the faculty classes
    const classIds = facultyClasses.map(fc => fc.id);
    
    const { data: grades, error: gradesError } = await supabaseAdmin
      .from('student_grades_detailed')
      .select('*')
      .eq('student_roll_number', rollNumber)
      .in('faculty_class_id', classIds)
      .order('subject_name', { ascending: true })
      .order('exam_type', { ascending: true });

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      );
    }

    // Group grades by subject
    const subjectMap = new Map();

    // Initialize subjects from faculty classes (even if no grades exist yet)
    facultyClasses.forEach(fc => {
      const key = `${fc.subject_code}-${fc.subject_name}`;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject: fc.subject_name,
          subjectCode: fc.subject_code,
          department: fc.department,
          section: fc.section,
          academicYear: fc.academic_year,
          semester: fc.semester,
          assignments: [],
          totalMarks: 0,
          obtainedMarks: 0,
          credits: 3, // Default credits, can be made configurable
          percentage: 0,
          grade: 'N/A',
          gradePoints: 0
        });
      }
    });

    // Add grades to subjects
    if (grades && grades.length > 0) {
      grades.forEach(grade => {
        const key = `${grade.subject_code}-${grade.subject_name}`;
        const subject = subjectMap.get(key);
        
        if (subject) {
          subject.assignments.push({
            id: grade.id,
            title: grade.exam_type,
            marks: grade.total_marks,
            totalMarks: 40, // Each mid is out of 40
            percentage: grade.percentage,
            examMarks: grade.exam_marks,
            assignmentMarks: grade.assignment_marks,
            otherMarks: grade.other_marks
          });
          
          subject.totalMarks += 40;
          subject.obtainedMarks += grade.total_marks;
        }
      });

      // Calculate subject averages and grades
      subjectMap.forEach(subject => {
        if (subject.totalMarks > 0) {
          subject.percentage = (subject.obtainedMarks / subject.totalMarks) * 100;
          
          // Calculate grade based on percentage
          if (subject.percentage >= 90) {
            subject.grade = 'A+';
            subject.gradePoints = 10;
          } else if (subject.percentage >= 80) {
            subject.grade = 'A';
            subject.gradePoints = 9;
          } else if (subject.percentage >= 70) {
            subject.grade = 'B+';
            subject.gradePoints = 8;
          } else if (subject.percentage >= 60) {
            subject.grade = 'B';
            subject.gradePoints = 7;
          } else if (subject.percentage >= 50) {
            subject.grade = 'C+';
            subject.gradePoints = 6;
          } else if (subject.percentage >= 40) {
            subject.grade = 'C';
            subject.gradePoints = 5;
          } else if (subject.percentage >= 35) {
            subject.grade = 'D';
            subject.gradePoints = 4;
          } else {
            subject.grade = 'F';
            subject.gradePoints = 0;
          }
        }
      });
    }

    const subjects = Array.from(subjectMap.values());

    // Calculate overall statistics
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const totalGradePoints = subjects.reduce((sum, s) => sum + (s.gradePoints * s.credits), 0);
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return NextResponse.json({
      subjects,
      statistics: {
        gpa: Math.round(gpa * 100) / 100,
        totalCredits,
        totalSubjects: subjects.length,
        passedSubjects: subjects.filter(s => s.percentage >= 37.5).length, // 15/40 average to pass
        failedSubjects: subjects.filter(s => s.percentage < 37.5 && s.totalMarks > 0).length
      },
      student: {
        rollNumber: student.roll_number,
        name: student.name,
        department: student.department,
        section: student.section,
        year: student.year,
        semester: student.semester
      }
    });

  } catch (error) {
    console.error('Student grades API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}