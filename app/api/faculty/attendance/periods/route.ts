import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get distinct academic periods from students25 table
    const { data: studentPeriods, error } = await supabase
      .from('students25')
      .select('year, semester')
      .not('year', 'is', null)
      .not('semester', 'is', null);

    if (error) {
      console.error('Error fetching academic periods:', error);
      return NextResponse.json(
        { error: 'Failed to fetch academic periods' },
        { status: 500 }
      );
    }

    // Create unique periods and format them
    const uniquePeriods = new Map<string, { year: string; semester: string }>();
    
    studentPeriods?.forEach(period => {
      const key = `${period.year}-${period.semester}`;
      if (!uniquePeriods.has(key)) {
        uniquePeriods.set(key, {
          year: period.year,
          semester: period.semester
        });
      }
    });

    // Convert to array and sort (most recent first)
    const periods = Array.from(uniquePeriods.values()).map(period => ({
      year: period.year,
      semester: period.semester,
      label: `${period.year} Year - Semester ${period.semester}`
    }));

    // Sort periods - prioritize current academic year
    periods.sort((a, b) => {
      // Custom sorting logic for academic years and semesters
      const yearOrder = ['IV', 'III', 'II', 'I', 'II MBA', 'I MBA'];
      const semesterOrder = ['VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'];
      
      const aYearIndex = yearOrder.indexOf(a.year);
      const bYearIndex = yearOrder.indexOf(b.year);
      
      if (aYearIndex !== bYearIndex) {
        return aYearIndex - bYearIndex;
      }
      
      const aSemIndex = semesterOrder.indexOf(a.semester);
      const bSemIndex = semesterOrder.indexOf(b.semester);
      
      return aSemIndex - bSemIndex;
    });

    return NextResponse.json({
      periods,
      count: periods.length
    });

  } catch (error) {
    console.error('Academic periods API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}