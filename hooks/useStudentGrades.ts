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
    if (!user?.roll_no) return;
    
    setLoading(true);
    try {
      // Fetch real grades from the API
      const response = await fetch(`/api/student/grades?rollNumber=${encodeURIComponent(user.roll_no)}`);
      
      if (!response.ok) {
        console.error('Failed to fetch grades:', response.status);
        // Fall back to mock data if API fails
        await fetchMockGradesData();
        return;
      }

      const data = await response.json();
      
      if (!data.subjects || data.subjects.length === 0) {
        // No real grades yet, use mock data
        await fetchMockGradesData();
        return;
      }

      // Process real grades data
      const subjects = data.subjects.map((subject: any) => ({
        ...subject,
        percentage: Math.round(subject.percentage * 10) / 10
      }));

      // Group by semester (for now, assume all subjects are in current semester)
      const currentSemester = parseInt(data.student.semester) || 1;
      const semesterGrades: SemesterGrades = {
        semester: currentSemester,
        term: `Semester ${currentSemester}`,
        subjects,
        gpa: data.statistics.gpa,
        totalCredits: data.statistics.totalCredits
      };

      // Calculate grade distribution
      const gradeDistribution = new Map<string, number>();
      subjects.forEach((subject: any) => {
        if (subject.grade && subject.grade !== 'N/A') {
          gradeDistribution.set(subject.grade, (gradeDistribution.get(subject.grade) || 0) + 1);
        }
      });

      const totalSubjects = Array.from(gradeDistribution.values()).reduce((sum, count) => sum + count, 0);
      const gradeDistributionArray = Array.from(gradeDistribution.entries()).map(([grade, count]) => ({
        grade,
        count,
        percentage: totalSubjects > 0 ? Math.round((count / totalSubjects) * 100) : 0,
      }));

      setGradeStats({
        cgpa: data.statistics.gpa,
        totalCredits: data.statistics.totalCredits,
        semesters: [semesterGrades],
        gradeDistribution: gradeDistributionArray,
      });

      setSelectedSemester(currentSemester);

    } catch (error) {
      console.error('Error fetching grades data:', error);
      // Fall back to mock data on error
      await fetchMockGradesData();
    } finally {
      setLoading(false);
    }
  };

  const fetchMockGradesData = async () => {
    try {
      // Mock data for demonstration - in real implementation, this would be removed
      const mockSemesters: SemesterGrades[] = [
        {
          semester: 5,
          term: 'Semester V',
          subjects: [
            {
              subject: 'Data Structures',
              subjectCode: 'IT123',
              semester: 5,
              term: 'Semester V',
              assignments: [
                { id: 'mid1', title: 'Mid 1', marks: 32, totalMarks: 40, percentage: 80 },
                { id: 'mid2', title: 'Mid 2', marks: 37, totalMarks: 40, percentage: 92.5 }
              ],
              totalMarks: 80,
              obtainedMarks: 69,
              percentage: 86.25,
              grade: 'A',
              gradePoints: 9,
              credits: 4
            },
            {
              subject: 'Data Mining',
              subjectCode: 'IT456',
              semester: 5,
              term: 'Semester V',
              assignments: [
                { id: 'mid1', title: 'Mid 1', marks: 29, totalMarks: 40, percentage: 72.5 }
              ],
              totalMarks: 40,
              obtainedMarks: 29,
              percentage: 72.5,
              grade: 'B+',
              gradePoints: 8,
              credits: 3
            }
          ],
          gpa: 8.57,
          totalCredits: 7
        }
      ];

      const gradeDistribution = [
        { grade: 'A', count: 1, percentage: 50 },
        { grade: 'B+', count: 1, percentage: 50 }
      ];

      setGradeStats({
        cgpa: 8.57,
        totalCredits: 7,
        semesters: mockSemesters,
        gradeDistribution
      });

      setSelectedSemester(5);

    } catch (error) {
      console.error('Error setting mock grades data:', error);
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