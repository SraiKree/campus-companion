'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentGrades } from '@/hooks/useStudentGrades';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  GraduationCap, 
  TrendingUp, 
  Award, 
  BookOpen,
  Target,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

const GRADE_COLORS = {
  'A+': '#10b981',
  'A': '#059669',
  'B+': '#3b82f6',
  'B': '#2563eb',
  'C+': '#f59e0b',
  'C': '#d97706',
  'D': '#ef4444',
  'F': '#dc2626',
};

export default function StudentGradesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { loading, gradeStats, selectedSemester, setSelectedSemester } = useStudentGrades();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading grades...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  if (!gradeStats || gradeStats.semesters.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          tabs={
            <div className="flex items-center gap-2">
              <Link href="/student">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Link href="/student/attendance">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Attendance
                </Button>
              </Link>
              <Link href="/student/assignments">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Assignments
                </Button>
              </Link>
              <Link href="/student/leave-request">
                <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                  Leave Request
                </Button>
              </Link>
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
                Grades
              </Button>
            </div>
          }
        />
        <main className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center max-w-md">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">No Grades Available</h1>
              <p className="text-muted-foreground mb-4">Your grades will appear here once assignments are graded.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentSemester = gradeStats.semesters.find(s => s.semester === selectedSemester);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Dashboard
              </Button>
            </Link>
            <Link href="/student/attendance">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
            </Link>
            <Link href="/student/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
            <Link href="/student/leave-request">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Leave Request
              </Button>
            </Link>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Grades
            </Button>
          </div>
        }
      />
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CGPA</p>
                  <p className="text-2xl font-bold">{gradeStats.cgpa}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">{gradeStats.totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Semesters</p>
                  <p className="text-2xl font-bold">{gradeStats.semesters.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current GPA</p>
                  <p className="text-2xl font-bold">{currentSemester?.gpa || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="semester">Semester View</TabsTrigger>
            <TabsTrigger value="subjects">Subject Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GPA Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    GPA Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={gradeStats.semesters}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="term" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="gpa" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gradeStats.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ grade, percentage }) => `${grade} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {gradeStats.gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Semester Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeStats.semesters.map((semester) => (
                    <div key={semester.semester} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{semester.term}</h3>
                        <p className="text-sm text-muted-foreground">{semester.subjects.length} subjects • {semester.totalCredits} credits</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{semester.gpa}</p>
                        <p className="text-sm text-muted-foreground">GPA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="semester" className="space-y-6">
            {/* Semester Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Semester</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {gradeStats.semesters.map((semester) => (
                    <Button
                      key={semester.semester}
                      variant={selectedSemester === semester.semester ? "default" : "outline"}
                      onClick={() => setSelectedSemester(semester.semester)}
                    >
                      {semester.term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {currentSemester && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentSemester.term} - Subject Grades</CardTitle>
                  <p className="text-muted-foreground">GPA: {currentSemester.gpa} • Credits: {currentSemester.totalCredits}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSemester.subjects.map((subject) => (
                      <div key={subject.subject} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{subject.subject}</h3>
                            <p className="text-sm text-muted-foreground">{subject.subjectCode} • {subject.credits} credits</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="secondary" 
                              className="text-lg px-3 py-1"
                              style={{ 
                                backgroundColor: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS] + '20',
                                color: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS]
                              }}
                            >
                              {subject.grade}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">{subject.percentage}%</p>
                          </div>
                        </div>
                        <Progress value={subject.percentage} className="mb-3" />
                        <div className="text-sm text-muted-foreground">
                          {subject.obtainedMarks} / {subject.totalMarks} marks • {subject.assignments.length} assignments
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {currentSemester && (
              <div className="space-y-6">
                {currentSemester.subjects.map((subject) => (
                  <Card key={subject.subject}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{subject.subject}</CardTitle>
                          <p className="text-muted-foreground">{subject.subjectCode} • {subject.credits} credits</p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-lg px-3 py-1"
                          style={{ 
                            backgroundColor: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS] + '20',
                            color: GRADE_COLORS[subject.grade as keyof typeof GRADE_COLORS]
                          }}
                        >
                          {subject.grade} ({subject.percentage}%)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{subject.obtainedMarks}</p>
                            <p className="text-sm text-muted-foreground">Obtained</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{subject.totalMarks}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{subject.gradePoints}</p>
                            <p className="text-sm text-muted-foreground">Grade Points</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold mb-3">Mid Exam Breakdown</h4>
                          <div className="text-xs text-muted-foreground mb-2">
                            Each Mid: Exam (30 marks) + Assignment (5 marks) + Other (5 marks) = 40 marks total
                          </div>
                          <div className="space-y-2">
                            {subject.assignments.map((assignment) => (
                              <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{assignment.title}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    assignment.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    assignment.percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                                    assignment.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {assignment.percentage >= 90 ? 'A+' :
                                     assignment.percentage >= 80 ? 'A' :
                                     assignment.percentage >= 70 ? 'B+' :
                                     assignment.percentage >= 60 ? 'B' : 'C'}
                                  </span>
                                  {assignment.marks < assignment.totalMarks && (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                      Partial Grading
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold">{assignment.marks}/{assignment.totalMarks}</span>
                                  <span className="text-sm text-muted-foreground ml-2">({assignment.percentage.toFixed(1)}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentSemester?.subjects || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subjectCode" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grade Points Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Points Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentSemester?.subjects || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subjectCode" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="gradePoints" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights - Only Current Semester */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights - Current Semester</CardTitle>
                <p className="text-sm text-muted-foreground">Passing requirement: Average of both Mids ≥ 15/40 (37.5%)</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Strengths */}
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">✅ Strengths (80%+ Performance)</h4>
                    <div className="space-y-2">
                      {currentSemester?.subjects
                        .filter(s => s.percentage >= 80)
                        .map(subject => (
                          <div key={subject.subject} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{subject.subject}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-green-700 font-semibold">{subject.percentage}%</span>
                              <p className="text-xs text-green-600">Excellent performance!</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-700">⚠️ Areas for Improvement</h4>
                    <div className="space-y-3">
                      {currentSemester?.subjects
                        .filter(s => s.percentage < 80)
                        .map(subject => {
                          const mid1 = subject.assignments.find(a => a.title === 'Mid 1');
                          const mid2 = subject.assignments.find(a => a.title === 'Mid 2');
                          const currentAverage = subject.percentage;
                          const isAtRisk = currentAverage < 37.5; // Below passing threshold
                          const needsImprovement = currentAverage < 60; // Below good performance
                          
                          // Calculate what's needed for next mid if one is missing
                          let nextMidAdvice = '';
                          if (mid1 && !mid2) {
                            const neededForPass = Math.max(0, (15 * 2) - mid1.marks); // Need average 15, so total 30
                            const neededForGood = Math.max(0, (24 * 2) - mid1.marks); // Need average 24 (60%), so total 48
                            nextMidAdvice = `Need ${neededForPass}/40 to pass, ${neededForGood}/40 for good grade`;
                          } else if (!mid1 && mid2) {
                            const neededForPass = Math.max(0, (15 * 2) - mid2.marks);
                            const neededForGood = Math.max(0, (24 * 2) - mid2.marks);
                            nextMidAdvice = `Need ${neededForPass}/40 to pass, ${neededForGood}/40 for good grade`;
                          }

                          return (
                            <div key={subject.subject} className={`p-4 rounded-lg border ${
                              isAtRisk ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isAtRisk ? 'bg-red-500' : 'bg-orange-500'
                                  }`}></div>
                                  <span className="font-medium">{subject.subject}</span>
                                  {isAtRisk && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                      AT RISK
                                    </span>
                                  )}
                                </div>
                                <span className={`font-semibold ${
                                  isAtRisk ? 'text-red-700' : 'text-orange-700'
                                }`}>
                                  {subject.percentage}%
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                {/* Current Status */}
                                <div className="flex justify-between">
                                  <span>Current Average:</span>
                                  <span>{subject.obtainedMarks}/{subject.totalMarks} marks</span>
                                </div>
                                
                                {/* Mid Breakdown */}
                                {mid1 && mid2 && (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white p-2 rounded">
                                      <span className="font-medium">Mid 1:</span> {mid1.marks}/40
                                    </div>
                                    <div className="bg-white p-2 rounded">
                                      <span className="font-medium">Mid 2:</span> {mid2.marks}/40
                                    </div>
                                  </div>
                                )}
                                
                                {/* Advice */}
                                {isAtRisk && (
                                  <div className="bg-red-100 p-2 rounded text-red-800">
                                    <p className="font-medium">⚠️ FAILING ALERT:</p>
                                    <p>Average below 15/40 (37.5%). {nextMidAdvice || 'Focus on improving performance!'}</p>
                                  </div>
                                )}
                                
                                {needsImprovement && !isAtRisk && (
                                  <div className="bg-orange-100 p-2 rounded text-orange-800">
                                    <p className="font-medium">💡 Improvement Needed:</p>
                                    <p>{nextMidAdvice || 'Aim for 60%+ for better grades'}</p>
                                  </div>
                                )}
                                
                                {/* Specific recommendations */}
                                <div className="bg-white p-2 rounded">
                                  <p className="font-medium text-gray-700">Recommendations:</p>
                                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                    <li>• Focus on exam preparation (30/40 marks)</li>
                                    <li>• Complete assignments on time (5/40 marks)</li>
                                    <li>• Participate in class activities (5/40 marks)</li>
                                    {isAtRisk && <li>• <strong>Seek help from faculty immediately</strong></li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Overall Semester Status */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">📊 Overall Semester Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="font-semibold text-green-700">Passing Subjects</p>
                        <p className="text-2xl font-bold text-green-800">
                          {currentSemester?.subjects.filter(s => s.percentage >= 37.5).length || 0}
                        </p>
                        <p className="text-green-600">out of {currentSemester?.subjects.length || 0}</p>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <p className="font-semibold text-orange-700">Need Improvement</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {currentSemester?.subjects.filter(s => s.percentage >= 37.5 && s.percentage < 60).length || 0}
                        </p>
                        <p className="text-orange-600">subjects</p>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="font-semibold text-red-700">At Risk</p>
                        <p className="text-2xl font-bold text-red-800">
                          {currentSemester?.subjects.filter(s => s.percentage < 37.5).length || 0}
                        </p>
                        <p className="text-red-600">subjects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
