import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubjectGrade, SemesterGrades, GradeStats } from '@/types/erp';

export const useStudentGrades = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  useEffect(() => {
    if (!user) return;
    fetchGradesData();
  }, [user]);

  const calculateGrade = (percentage: number): { grade: string; gradePoints: number } => {
    if (percentage >= 90) return { grade: 'A+', gradePoints: 10 };
    if (percentage >= 80) return { grade: 'A', gradePoints: 9 };
    if (percentage >= 70) return { grade: 'B+', gradePoints: 8 };
    if (percentage >= 60) return { grade: 'B', gradePoints: 7 };
    if (percentage >= 50) return { grade: 'C+', gradePoints: 6 };
    if (percentage >= 40) return { grade: 'C', gradePoints: 5 };
    if (percentage >= 35) return { grade: 'D', gradePoints: 4 };
    return { grade: 'F', gradePoints: 0 };
  };

  const fetchGradesData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Updated structure: Mid (30) + Assignment (5) + Other (5) = 40 marks total per mid
      const mockAssignments = [
        // Semester 1 - Mid 1 (30 marks exam + 5 assignment + 5 other = 40 total)
        { id: 'sem1-math-mid1', title: 'Mid 1', subject: 'Mathematics', subject_code: 'MATH101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem1-physics-mid1', title: 'Mid 1', subject: 'Physics', subject_code: 'PHY101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 3, exam_type: 'Mid 1' },
        { id: 'sem1-cs-mid1', title: 'Mid 1', subject: 'Computer Science', subject_code: 'CS101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem1-chem-mid1', title: 'Mid 1', subject: 'Chemistry', subject_code: 'CHEM101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 3, exam_type: 'Mid 1' },
        { id: 'sem1-eng-mid1', title: 'Mid 1', subject: 'English', subject_code: 'ENG101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 2, exam_type: 'Mid 1' },
        
        // Semester 1 - Mid 2
        { id: 'sem1-math-mid2', title: 'Mid 2', subject: 'Mathematics', subject_code: 'MATH101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem1-physics-mid2', title: 'Mid 2', subject: 'Physics', subject_code: 'PHY101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 3, exam_type: 'Mid 2' },
        { id: 'sem1-cs-mid2', title: 'Mid 2', subject: 'Computer Science', subject_code: 'CS101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem1-chem-mid2', title: 'Mid 2', subject: 'Chemistry', subject_code: 'CHEM101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 3, exam_type: 'Mid 2' },
        { id: 'sem1-eng-mid2', title: 'Mid 2', subject: 'English', subject_code: 'ENG101', total_marks: 40, semester: 1, term: 'Semester 1', credits: 2, exam_type: 'Mid 2' },
        
        // Semester 2 - Mid 1
        { id: 'sem2-advmath-mid1', title: 'Mid 1', subject: 'Advanced Mathematics', subject_code: 'MATH201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem2-ds-mid1', title: 'Mid 1', subject: 'Data Structures', subject_code: 'CS201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem2-electronics-mid1', title: 'Mid 1', subject: 'Electronics', subject_code: 'ECE201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 3, exam_type: 'Mid 1' },
        { id: 'sem2-dbms-mid1', title: 'Mid 1', subject: 'Database Management', subject_code: 'CS202', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem2-stats-mid1', title: 'Mid 1', subject: 'Statistics', subject_code: 'STAT201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 3, exam_type: 'Mid 1' },
        
        // Semester 2 - Mid 2
        { id: 'sem2-advmath-mid2', title: 'Mid 2', subject: 'Advanced Mathematics', subject_code: 'MATH201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem2-ds-mid2', title: 'Mid 2', subject: 'Data Structures', subject_code: 'CS201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem2-electronics-mid2', title: 'Mid 2', subject: 'Electronics', subject_code: 'ECE201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 3, exam_type: 'Mid 2' },
        { id: 'sem2-dbms-mid2', title: 'Mid 2', subject: 'Database Management', subject_code: 'CS202', total_marks: 40, semester: 2, term: 'Semester 2', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem2-stats-mid2', title: 'Mid 2', subject: 'Statistics', subject_code: 'STAT201', total_marks: 40, semester: 2, term: 'Semester 2', credits: 3, exam_type: 'Mid 2' },
        
        // Semester 3 - Mid 1 (Current Semester)
        { id: 'sem3-algorithms-mid1', title: 'Mid 1', subject: 'Algorithms', subject_code: 'CS301', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem3-networks-mid1', title: 'Mid 1', subject: 'Computer Networks', subject_code: 'CS302', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem3-os-mid1', title: 'Mid 1', subject: 'Operating Systems', subject_code: 'CS303', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 1' },
        { id: 'sem3-se-mid1', title: 'Mid 1', subject: 'Software Engineering', subject_code: 'CS304', total_marks: 40, semester: 3, term: 'Semester 3', credits: 3, exam_type: 'Mid 1' },
        { id: 'sem3-ml-mid1', title: 'Mid 1', subject: 'Machine Learning', subject_code: 'CS305', total_marks: 40, semester: 3, term: 'Semester 3', credits: 3, exam_type: 'Mid 1' },
        
        // Semester 3 - Mid 2 (Current Semester)
        { id: 'sem3-algorithms-mid2', title: 'Mid 2', subject: 'Algorithms', subject_code: 'CS301', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem3-networks-mid2', title: 'Mid 2', subject: 'Computer Networks', subject_code: 'CS302', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem3-os-mid2', title: 'Mid 2', subject: 'Operating Systems', subject_code: 'CS303', total_marks: 40, semester: 3, term: 'Semester 3', credits: 4, exam_type: 'Mid 2' },
        { id: 'sem3-se-mid2', title: 'Mid 2', subject: 'Software Engineering', subject_code: 'CS304', total_marks: 40, semester: 3, term: 'Semester 3', credits: 3, exam_type: 'Mid 2' },
        { id: 'sem3-ml-mid2', title: 'Mid 2', subject: 'Machine Learning', subject_code: 'CS305', total_marks: 40, semester: 3, term: 'Semester 3', credits: 3, exam_type: 'Mid 2' },
      ];

      const mockSubmissions = [
        // Semester 1 - Mid 1 Results (Exam: 30, Assignment: 5, Other: 5 = 40 total)
        { assignment_id: 'sem1-math-mid1', marks: 34 },      // Math: 25/30 exam + 5/5 assignment + 4/5 other = 34/40 (85%)
        { assignment_id: 'sem1-physics-mid1', marks: 31 },   // Physics: 22/30 exam + 5/5 assignment + 4/5 other = 31/40 (77.5%)
        { assignment_id: 'sem1-cs-mid1', marks: 37 },        // CS: 28/30 exam + 5/5 assignment + 4/5 other = 37/40 (92.5%)
        { assignment_id: 'sem1-chem-mid1', marks: 35 },      // Chemistry: 26/30 exam + 4/5 assignment + 5/5 other = 35/40 (87.5%)
        { assignment_id: 'sem1-eng-mid1', marks: 33 },       // English: 24/30 exam + 5/5 assignment + 4/5 other = 33/40 (82.5%)
        
        // Semester 1 - Mid 2 Results (Improved performance)
        { assignment_id: 'sem1-math-mid2', marks: 36 },      // Math: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem1-physics-mid2', marks: 34 },   // Physics: 25/30 exam + 5/5 assignment + 4/5 other = 34/40 (85%)
        { assignment_id: 'sem1-cs-mid2', marks: 38 },        // CS: 29/30 exam + 5/5 assignment + 4/5 other = 38/40 (95%)
        { assignment_id: 'sem1-chem-mid2', marks: 36 },      // Chemistry: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem1-eng-mid2', marks: 35 },       // English: 26/30 exam + 5/5 assignment + 4/5 other = 35/40 (87.5%)
        
        // Semester 2 - Mid 1 Results (Some assignments not graded yet)
        { assignment_id: 'sem2-advmath-mid1', marks: 30 },   // Advanced Math: 25/30 exam + 5/5 assignment + 0/5 other (not graded) = 30/40 (75%)
        { assignment_id: 'sem2-ds-mid1', marks: 35 },        // Data Structures: 26/30 exam + 5/5 assignment + 4/5 other = 35/40 (87.5%)
        { assignment_id: 'sem2-electronics-mid1', marks: 29 }, // Electronics: 22/30 exam + 4/5 assignment + 3/5 other = 29/40 (72.5%)
        { assignment_id: 'sem2-dbms-mid1', marks: 34 },      // Database: 25/30 exam + 5/5 assignment + 4/5 other = 34/40 (85%)
        { assignment_id: 'sem2-stats-mid1', marks: 32 },     // Statistics: 24/30 exam + 5/5 assignment + 3/5 other = 32/40 (80%)
        
        // Semester 2 - Mid 2 Results (Better grading from faculty)
        { assignment_id: 'sem2-advmath-mid2', marks: 33 },   // Advanced Math: 26/30 exam + 5/5 assignment + 2/5 other = 33/40 (82.5%)
        { assignment_id: 'sem2-ds-mid2', marks: 36 },        // Data Structures: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem2-electronics-mid2', marks: 31 }, // Electronics: 23/30 exam + 5/5 assignment + 3/5 other = 31/40 (77.5%)
        { assignment_id: 'sem2-dbms-mid2', marks: 36 },      // Database: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem2-stats-mid2', marks: 34 },     // Statistics: 25/30 exam + 5/5 assignment + 4/5 other = 34/40 (85%)
        
        // Semester 3 - Mid 1 Results (Current Semester - Mixed performance with one at-risk subject)
        { assignment_id: 'sem3-algorithms-mid1', marks: 37 }, // Algorithms: 28/30 exam + 5/5 assignment + 4/5 other = 37/40 (92.5%)
        { assignment_id: 'sem3-networks-mid1', marks: 35 },   // Networks: 26/30 exam + 5/5 assignment + 4/5 other = 35/40 (87.5%)
        { assignment_id: 'sem3-os-mid1', marks: 36 },         // OS: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem3-se-mid1', marks: 36 },         // Software Eng: 27/30 exam + 5/5 assignment + 4/5 other = 36/40 (90%)
        { assignment_id: 'sem3-ml-mid1', marks: 12 },         // ML: 10/30 exam + 2/5 assignment + 0/5 other = 12/40 (30%) - AT RISK!
        
        // Semester 3 - Mid 2 Results (Current Semester - Only some completed to show warnings)
        { assignment_id: 'sem3-algorithms-mid2', marks: 38 }, // Algorithms: 29/30 exam + 5/5 assignment + 4/5 other = 38/40 (95%)
        { assignment_id: 'sem3-networks-mid2', marks: 37 },   // Networks: 28/30 exam + 5/5 assignment + 4/5 other = 37/40 (92.5%)
        { assignment_id: 'sem3-os-mid2', marks: 38 },         // OS: 29/30 exam + 5/5 assignment + 4/5 other = 38/40 (95%)
        { assignment_id: 'sem3-se-mid2', marks: 38 },         // Software Eng: 29/30 exam + 5/5 assignment + 4/5 other = 38/40 (95%)
        // ML Mid 2 not taken yet - will show warning about what's needed
      ];

      const assignments = mockAssignments;
      const submissions = mockSubmissions;

      if (!assignments || assignments.length === 0) {
        console.log('No assignments found for student');
        setGradeStats({
          cgpa: 0,
          totalCredits: 0,
          semesters: [],
          gradeDistribution: [],
        });
        setLoading(false);
        return;
      }

      // Create submission map
      const submissionMap = new Map(submissions.map((s: any) => [s.assignment_id, s.marks]));

      // Group by semester and subject
      const semesterMap = new Map<number, Map<string, any>>();

      assignments.forEach((assignment: any) => {
        const semester = Number(assignment.semester) || 1;
        const subject = assignment.subject;
        const marks = Number(submissionMap.get(assignment.id)) || 0;

        if (!semesterMap.has(semester)) {
          semesterMap.set(semester, new Map());
        }

        const subjectMap = semesterMap.get(semester)!;
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, {
            subject,
            subjectCode: assignment.subject_code || subject.substring(0, 3).toUpperCase(),
            semester,
            term: assignment.term || `Semester ${semester}`,
            assignments: [],
            totalMarks: 0,
            obtainedMarks: 0,
            credits: Number(assignment.credits) || 3,
          });
        }

        const subjectData = subjectMap.get(subject);
        subjectData.assignments.push({
          id: assignment.id,
          title: assignment.title,
          marks: Number(marks) || 0,
          totalMarks: Number(assignment.total_marks) || 1,
          percentage: ((Number(marks) || 0) / (Number(assignment.total_marks) || 1)) * 100,
        });
        subjectData.totalMarks += Number(assignment.total_marks) || 0;
        subjectData.obtainedMarks += Number(marks) || 0;
      });

      // Calculate grades and GPA
      const semesters: SemesterGrades[] = [];
      let totalGradePoints = 0;
      let totalCredits = 0;
      const gradeDistribution = new Map<string, number>();

      semesterMap.forEach((subjectMap, semesterNum) => {
        const subjects: SubjectGrade[] = [];
        let semesterGradePoints = 0;
        let semesterCredits = 0;

        subjectMap.forEach(subjectData => {
          const percentage = subjectData.totalMarks > 0 
            ? (subjectData.obtainedMarks / subjectData.totalMarks) * 100 
            : 0;
          
          const { grade, gradePoints } = calculateGrade(percentage);
          
          const subjectGrade: SubjectGrade = {
            ...subjectData,
            percentage: Math.round(percentage * 10) / 10,
            grade,
            gradePoints,
          };

          subjects.push(subjectGrade);
          
          semesterGradePoints += gradePoints * subjectData.credits;
          semesterCredits += subjectData.credits;
          totalGradePoints += gradePoints * subjectData.credits;
          totalCredits += subjectData.credits;

          // Update grade distribution
          gradeDistribution.set(grade, (gradeDistribution.get(grade) || 0) + 1);
        });

        const gpa = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;

        semesters.push({
          semester: semesterNum,
          term: `Semester ${semesterNum}`,
          subjects,
          gpa: Math.round(gpa * 100) / 100,
          totalCredits: semesterCredits,
        });
      });

      // Sort semesters
      semesters.sort((a, b) => a.semester - b.semester);

      // Calculate CGPA
      const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      // Format grade distribution
      const totalSubjects = Array.from(gradeDistribution.values()).reduce((sum, count) => sum + count, 0);
      const gradeDistributionArray = Array.from(gradeDistribution.entries()).map(([grade, count]) => ({
        grade,
        count,
        percentage: totalSubjects > 0 ? Math.round((count / totalSubjects) * 100) : 0,
      }));

      setGradeStats({
        cgpa: Math.round(cgpa * 100) / 100,
        totalCredits,
        semesters,
        gradeDistribution: gradeDistributionArray,
      });

      // Set default selected semester to the latest
      if (semesters.length > 0) {
        setSelectedSemester(semesters[semesters.length - 1].semester);
      }

    } catch (error) {
      console.error('Error fetching grades data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    gradeStats,
    selectedSemester,
    setSelectedSemester,
    refetch: fetchGradesData,
  };
};