'use client';

import './../faculty-design.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface FacultyClass {
  id: string;
  subject_name: string;
  subject_code: string;
  department: string;
  section: string;
  academic_year: string;
  semester: string;
  weekday: number;
  period_start: number;
  period_end: number;
  is_lab: boolean;
}

interface Student {
  roll_number: string;
  name: string;
  department: string;
  section: string;
}

interface GradeRow {
  // Mid 1 components
  m1Exam: number | null;
  m1Asg: number | null;
  m1Oth: number | null;
  // Mid 2 components
  m2Exam: number | null;
  m2Asg: number | null;
  m2Oth: number | null;
  // External SEE — not currently tracked in our schema but reserved
  see: number | null;
}

interface AcademicPeriod {
  year: string;
  semester: string;
  label: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();

// ── Mark input — clamped, validated, fractional ──────────────────────
const MarkInput = ({
  value,
  max,
  onCommit,
  disabled,
}: {
  value: number | null;
  max: number;
  onCommit: (v: number | null) => void;
  disabled?: boolean;
}) => {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    setText(value == null ? '' : String(value));
  }, [value]);

  const num = text === '' ? null : Number(text);
  const invalid = text !== '' && (Number.isNaN(num) || (num as number) < 0 || (num as number) > max);

  const commit = () => {
    if (text === '') return onCommit(null);
    if (invalid) return;
    onCommit(num);
  };

  return (
    <input
      type="number"
      value={text}
      disabled={disabled}
      min={0}
      max={max}
      step="0.5"
      onChange={e => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
      }}
      placeholder="—"
      className={`fac-mark-input${text === '' ? ' is-empty' : ''}${invalid ? ' is-invalid' : ''}`}
      style={disabled ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
    />
  );
};

// ── Final-grade banding (Internal /40 + SEE /60 → /100) ──────────────
type Tone = 'green' | 'amber' | 'red';
const gradeFor = (total: number | null): { letter: string; tone: Tone } | null => {
  if (total == null) return null;
  if (total >= 90) return { letter: 'O', tone: 'green' };
  if (total >= 80) return { letter: 'A+', tone: 'green' };
  if (total >= 70) return { letter: 'A', tone: 'green' };
  if (total >= 60) return { letter: 'B+', tone: 'amber' };
  if (total >= 50) return { letter: 'B', tone: 'amber' };
  if (total >= 40) return { letter: 'C', tone: 'amber' };
  return { letter: 'F', tone: 'red' };
};
const gradeBg: Record<Tone, string> = {
  green: 'var(--fd-brand-100)',
  amber: 'var(--fd-amber-100)',
  red: 'var(--fd-red-100)',
};
const gradeFg: Record<Tone, string> = {
  green: 'var(--fd-brand-600)',
  amber: 'var(--fd-amber-600)',
  red: 'var(--fd-red-600)',
};

export default function FacultyGradesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Record<string, GradeRow>>({});
  const [view, setView] = useState<'mid1' | 'mid2' | 'final'>('mid1');
  const [searchTerm, setSearchTerm] = useState('');
  const [savingRoll, setSavingRoll] = useState<string | null>(null);

  const [availablePeriods, setAvailablePeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);

  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const cur = useMemo(() => classes.find(c => c.id === activeClassId) || null, [classes, activeClassId]);

  // Auth gate + initial period fetch
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'faculty') {
      router.push('/');
      return;
    }
    fetchPeriods();
  }, [loading, isAuthenticated, user, router]);

  // Re-fetch class list when period changes
  useEffect(() => {
    if (selectedPeriod && user?.id) fetchClasses();
  }, [selectedPeriod, user]);

  // Re-fetch students + grades when active class changes
  useEffect(() => {
    if (cur) {
      fetchStudentsAndGrades(cur);
    } else {
      setStudents([]);
      setRows({});
    }
  }, [activeClassId]);

  const fetchPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await fetch('/api/faculty/attendance/periods');
      if (res.ok) {
        const data = await res.json();
        setAvailablePeriods(data.periods || []);
        if (data.periods?.length > 0) setSelectedPeriod(data.periods[0]);
      }
    } catch {
      toast.error('Failed to load academic periods');
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchClasses = async () => {
    if (!user?.id || !selectedPeriod) return;
    setLoadingClasses(true);
    try {
      const res = await fetch(
        `/api/faculty/classes?facultyId=${user.id}&academicYear=${selectedPeriod.year}&semester=${selectedPeriod.semester}`,
      );
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsAndGrades = async (c: FacultyClass) => {
    setLoadingData(true);
    setSearchTerm('');
    try {
      const studentsRes = await fetch(
        `/api/faculty/attendance/students?department=${c.department}&section=${c.section}&academicYear=${c.academic_year}&semester=${c.semester}`,
      );
      const studentsJson = studentsRes.ok ? await studentsRes.json() : { students: [] };
      const list: Student[] = studentsJson.students || [];

      const [m1Res, m2Res] = await Promise.all([
        fetch(`/api/faculty/grades?classId=${c.id}&examType=Mid 1`),
        fetch(`/api/faculty/grades?classId=${c.id}&examType=Mid 2`),
      ]);
      const m1 = m1Res.ok ? (await m1Res.json()).grades || [] : [];
      const m2 = m2Res.ok ? (await m2Res.json()).grades || [] : [];

      const next: Record<string, GradeRow> = {};
      list.forEach((s: Student) => {
        next[s.roll_number] = {
          m1Exam: null, m1Asg: null, m1Oth: null,
          m2Exam: null, m2Asg: null, m2Oth: null,
          see: null,
        };
      });
      // Stamp marks from Mid 1 grades
      m1.forEach((g: { student_roll_number: string; exam_marks: number; assignment_marks: number; other_marks: number }) => {
        const r = next[g.student_roll_number];
        if (!r) return;
        r.m1Exam = g.exam_marks;
        r.m1Asg = g.assignment_marks;
        r.m1Oth = g.other_marks;
      });
      m2.forEach((g: { student_roll_number: string; exam_marks: number; assignment_marks: number; other_marks: number }) => {
        const r = next[g.student_roll_number];
        if (!r) return;
        r.m2Exam = g.exam_marks;
        r.m2Asg = g.assignment_marks;
        r.m2Oth = g.other_marks;
      });

      setStudents(list);
      setRows(next);
    } catch {
      toast.error('Failed to load grade data');
    } finally {
      setLoadingData(false);
    }
  };

  // Update a single mark cell — autosaves on blur (commit) once all 3 components for that mid are present
  const setCell = async (roll: string, key: keyof GradeRow, value: number | null) => {
    setRows(prev => {
      const r = prev[roll] || ({
        m1Exam: null, m1Asg: null, m1Oth: null,
        m2Exam: null, m2Asg: null, m2Oth: null,
        see: null,
      } as GradeRow);
      return { ...prev, [roll]: { ...r, [key]: value } };
    });

    if (!cur) return;
    if (view === 'final') return; // can't edit on final summary
    const examType = view === 'mid1' ? 'Mid 1' : 'Mid 2';
    const prefix = view === 'mid1' ? 'm1' : 'm2';

    // Re-read latest with our just-set value applied
    const r = { ...(rows[roll] || ({} as GradeRow)), [key]: value } as GradeRow;
    const examMarks = r[`${prefix}Exam` as keyof GradeRow] as number | null;
    const asgMarks = r[`${prefix}Asg` as keyof GradeRow] as number | null;
    const othMarks = r[`${prefix}Oth` as keyof GradeRow] as number | null;

    if (examMarks == null || asgMarks == null || othMarks == null) return;

    setSavingRoll(roll);
    try {
      const res = await fetch('/api/faculty/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: cur.id,
          studentRollNumber: roll,
          examType,
          examMarks,
          assignmentMarks: asgMarks,
          otherMarks: othMarks,
          academicYear: cur.academic_year,
          semester: cur.semester,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save grade');
      }
    } catch {
      toast.error('Failed to save grade');
    } finally {
      setSavingRoll(null);
    }
  };

  // ── Derived calculations ────────────────────────────────────────────
  const calc = (r: GradeRow | undefined) => {
    if (!r) return { m1: 0, m2: 0, avg: null as number | null, see: null as number | null, total: null as number | null, has1: false, has2: false };
    const has1 = r.m1Exam != null && r.m1Asg != null && r.m1Oth != null;
    const has2 = r.m2Exam != null && r.m2Asg != null && r.m2Oth != null;
    const m1 = (r.m1Exam ?? 0) + (r.m1Asg ?? 0) + (r.m1Oth ?? 0);
    const m2 = (r.m2Exam ?? 0) + (r.m2Asg ?? 0) + (r.m2Oth ?? 0);
    let avg: number | null = null;
    if (has1 && has2) avg = (m1 + m2) / 2;
    else if (has1) avg = m1;
    else if (has2) avg = m2;
    const see = r.see;
    const total = avg != null && see != null ? avg + see : null;
    return { m1, m2, avg, see, total, has1, has2 };
  };

  const stats = useMemo(() => {
    const all = students.map(s => calc(rows[s.roll_number]));
    const internalCount = all.filter(x => x.avg != null).length;
    const finalCount = all.filter(x => x.total != null).length;
    const internalMean =
      internalCount === 0 ? 0 : all.reduce((a, x) => a + (x.avg ?? 0), 0) / internalCount;
    const finalMean =
      finalCount === 0 ? 0 : all.reduce((a, x) => a + (x.total ?? 0), 0) / finalCount;
    const buckets: Record<string, number> = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, F: 0 };
    all.forEach(x => {
      const g = gradeFor(x.total);
      if (g) buckets[g.letter] += 1;
    });
    const completion = students.length === 0 ? 0 : Math.round((internalCount / students.length) * 100);
    return { internalMean, finalMean, internalCount, finalCount, buckets, completion };
  }, [students, rows]);

  const visible = useMemo(() => {
    return students.filter(
      s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [students, searchTerm]);

  if (loading || !isAuthenticated || user?.role !== 'faculty') return null;

  return (
    <FacultyLayout>
      <div className="fac-design">
        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="fac-pill fac-pill-cream">Internal Marks · {selectedPeriod?.label || 'Current Term'}</span>
            <h1 style={{ margin: '10px 0 4px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--fd-text)' }}>
              Grades
            </h1>
            <div style={{ color: 'var(--fd-text-2)', fontSize: 13 }}>
              Each Mid = Exam (30) + Assignment (5) + Other (5).&nbsp;
              Final = average of the two mids + Semester End Exam.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {availablePeriods.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap className="h-4 w-4" style={{ color: 'var(--fd-text-3)' }} />
                <select
                  className="fac-input"
                  style={{ width: 220, padding: '8px 12px' }}
                  value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.semester}` : ''}
                  onChange={e => {
                    const [year, semester] = e.target.value.split('-');
                    const p = availablePeriods.find(x => x.year === year && x.semester === semester);
                    if (p) {
                      setSelectedPeriod(p);
                      setActiveClassId(null);
                    }
                  }}
                >
                  {availablePeriods.map(p => (
                    <option key={`${p.year}-${p.semester}`} value={`${p.year}-${p.semester}`}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loadingPeriods ? (
          <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
            Loading academic periods…
          </div>
        ) : (
          <>
            {/* ── Subject chip selector ── */}
            {loadingClasses ? (
              <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                Loading classes…
              </div>
            ) : classes.length === 0 ? (
              <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No classes for this period</div>
                <div style={{ color: 'var(--fd-text-3)', fontSize: 13 }}>
                  Add classes in the timetable to start entering grades.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {classes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`fac-chip${activeClassId === c.id ? ' active' : ''}`}
                    onClick={() => setActiveClassId(c.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span className="fac-chip-code">{c.subject_code}</span>
                      {c.is_lab && (
                        <span className="fac-pill fac-pill-purple" style={{ padding: '2px 7px', fontSize: 9 }}>
                          Lab
                        </span>
                      )}
                    </div>
                    <div className="fac-chip-name">{c.subject_name}</div>
                    <div className="fac-chip-meta">
                      {c.department}-{c.section} · {WEEKDAYS[c.weekday - 1]}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Two-column body ── */}
            {cur && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
                {/* === Marks card === */}
                <div className="fac-card fac-card-flush">
                  {/* Header: subject info + view tabs */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--fd-line)', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <h3 className="fac-card-title">
                        {cur.subject_code} · {cur.subject_name}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--fd-text-3)', marginTop: 3 }}>
                        {cur.department}-{cur.section} · {stats.internalCount}/{students.length} internal entries complete
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <Search
                          className="h-3.5 w-3.5"
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fd-text-3)' }}
                        />
                        <input
                          className="fac-input"
                          style={{ width: 200, padding: '8px 10px 8px 30px' }}
                          placeholder="Search roll or name…"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="fac-seg">
                        {([
                          { id: 'mid1', label: 'Mid 1' },
                          { id: 'mid2', label: 'Mid 2' },
                          { id: 'final', label: 'Final Summary' },
                        ] as const).map(t => (
                          <button
                            key={t.id}
                            type="button"
                            className={`fac-seg-btn${view === t.id ? ' active' : ''}`}
                            onClick={() => setView(t.id)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  {loadingData ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                      Loading marks…
                    </div>
                  ) : visible.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                      No students in this class
                    </div>
                  ) : view !== 'final' ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="fac-table">
                        <thead>
                          <tr>
                            <th>Roll No.</th>
                            <th>Student</th>
                            <th style={{ textAlign: 'center' }}>
                              Exam
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /30
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              Assign.
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /5
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              Other
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /5
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              Total
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /40
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map(s => {
                            const r = rows[s.roll_number];
                            const prefix = view === 'mid1' ? 'm1' : 'm2';
                            const exam = r ? (r[`${prefix}Exam` as keyof GradeRow] as number | null) : null;
                            const asg = r ? (r[`${prefix}Asg` as keyof GradeRow] as number | null) : null;
                            const oth = r ? (r[`${prefix}Oth` as keyof GradeRow] as number | null) : null;
                            const total = (exam ?? 0) + (asg ?? 0) + (oth ?? 0);
                            const complete = exam != null && asg != null && oth != null;
                            const isSaving = savingRoll === s.roll_number;
                            return (
                              <tr key={s.roll_number}>
                                <td style={{ fontFamily: 'var(--fd-mono)', fontSize: 12, color: 'var(--fd-text-2)' }}>
                                  {s.roll_number}
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="fac-avatar">{initials(s.name)}</div>
                                    <span>
                                      {s.name}
                                      {isSaving && (
                                        <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--fd-brand-600)' }}>
                                          saving…
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <MarkInput
                                    value={exam}
                                    max={30}
                                    onCommit={v => setCell(s.roll_number, `${prefix}Exam` as keyof GradeRow, v)}
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <MarkInput
                                    value={asg}
                                    max={5}
                                    onCommit={v => setCell(s.roll_number, `${prefix}Asg` as keyof GradeRow, v)}
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <MarkInput
                                    value={oth}
                                    max={5}
                                    onCommit={v => setCell(s.roll_number, `${prefix}Oth` as keyof GradeRow, v)}
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontFamily: 'var(--fd-mono)',
                                      fontSize: 13,
                                      fontWeight: 800,
                                      color: complete
                                        ? total >= 20
                                          ? 'var(--fd-brand-600)'
                                          : 'var(--fd-red-600)'
                                        : 'var(--fd-text-3)',
                                    }}
                                  >
                                    {complete ? total : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Final summary read-only roll-up */
                    <div style={{ overflowX: 'auto' }}>
                      <table className="fac-table">
                        <thead>
                          <tr>
                            <th>Roll No.</th>
                            <th>Student</th>
                            <th style={{ textAlign: 'center' }}>
                              Mid 1
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /40
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              Mid 2
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /40
                              </span>
                            </th>
                            <th style={{ textAlign: 'center', background: 'var(--fd-brand-50)' }}>
                              Internal Avg
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /40
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              SEE
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /60 · ext.
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>
                              Total
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /100
                              </span>
                            </th>
                            <th style={{ textAlign: 'center' }}>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map(s => {
                            const r = rows[s.roll_number];
                            const c = calc(r);
                            const grade = gradeFor(c.total);
                            return (
                              <tr key={s.roll_number}>
                                <td style={{ fontFamily: 'var(--fd-mono)', fontSize: 12, color: 'var(--fd-text-2)' }}>
                                  {s.roll_number}
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="fac-avatar">{initials(s.name)}</div>
                                    {s.name}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="fac-mark-readonly">{c.has1 ? c.m1 : '—'}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className="fac-mark-readonly">{c.has2 ? c.m2 : '—'}</span>
                                </td>
                                <td style={{ textAlign: 'center', background: 'var(--fd-brand-50)' }}>
                                  <span
                                    className="fac-mark-readonly"
                                    style={{ color: 'var(--fd-brand-600)', fontWeight: 800 }}
                                  >
                                    {c.avg != null ? c.avg.toFixed(1) : '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    className="fac-mark-readonly"
                                    style={{ color: c.see != null ? 'var(--fd-text)' : 'var(--fd-text-3)' }}
                                  >
                                    {c.see != null ? c.see : '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontFamily: 'var(--fd-mono)',
                                      fontSize: 13,
                                      fontWeight: 800,
                                      color:
                                        c.total != null
                                          ? c.total >= 40
                                            ? 'var(--fd-text)'
                                            : 'var(--fd-red-600)'
                                          : 'var(--fd-text-3)',
                                    }}
                                  >
                                    {c.total != null ? c.total.toFixed(0) : '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {grade ? (
                                    <span
                                      className="fac-grade-chip"
                                      style={{ background: gradeBg[grade.tone], color: gradeFg[grade.tone] }}
                                    >
                                      {grade.letter}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--fd-text-3)' }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* === Side panel === */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Class average */}
                  <div className="fac-card">
                    <h3 className="fac-card-title">Class Average</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                      <AvgTile label="Internal" value={stats.internalMean} max={40} tone="brand" />
                      <AvgTile label="Final" value={stats.finalMean} max={100} tone="purple" />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                        <span style={{ color: 'var(--fd-text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Entry Completion
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--fd-text-2)' }}>{stats.completion}%</span>
                      </div>
                      <div className="fac-bar">
                        <span style={{ width: `${stats.completion}%`, background: 'var(--fd-brand-500)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Grade distribution */}
                  <div className="fac-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 className="fac-card-title">Grade Distribution</h3>
                      <span className="fac-pill fac-pill-muted" style={{ fontSize: 9 }}>
                        {stats.finalCount} graded
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(['O', 'A+', 'A', 'B+', 'B', 'C', 'F'] as const).map(letter => {
                        const count = stats.buckets[letter] || 0;
                        const pct = stats.finalCount ? (count / stats.finalCount) * 100 : 0;
                        const tone: Tone = letter === 'F' ? 'red' : letter === 'C' || letter === 'B' ? 'amber' : 'green';
                        return (
                          <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              className="fac-grade-chip"
                              style={{ background: gradeBg[tone], color: gradeFg[tone], minWidth: 32, fontSize: 11 }}
                            >
                              {letter}
                            </span>
                            <div style={{ flex: 1, height: 6, background: 'var(--fd-line-2)', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: gradeFg[tone] }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fd-text-2)', minWidth: 28, textAlign: 'right' }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formula reminder */}
                  <div className="fac-card" style={{ background: 'var(--fd-brand-50)', borderColor: 'var(--fd-brand-100)' }}>
                    <div className="fac-eyebrow" style={{ color: 'var(--fd-brand-600)' }}>How it adds up</div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--fd-text-2)', lineHeight: 1.5 }}>
                      <FormulaRow label="Mid (×2)" parts={['Exam 30', 'Assign. 5', 'Other 5']} total="40" />
                      <FormulaRow label="Internal" parts={['AVG(Mid 1, Mid 2)']} total="40" />
                      <FormulaRow label="External" parts={['SEE — populated']} total="60" muted />
                      <FormulaRow label="Final" parts={['Internal + SEE']} total="100" emphasis />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FacultyLayout>
  );
}

// ── Small composite primitives used only here ────────────────────────
const AvgTile = ({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'brand' | 'purple' }) => {
  const tones = {
    brand: { bg: 'var(--fd-brand-50)', fg: 'var(--fd-brand-600)' },
    purple: { bg: 'var(--fd-purple-100)', fg: 'var(--fd-purple-600)' },
  } as const;
  const t = tones[tone];
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: t.bg, borderRadius: 12, padding: '12px 14px' }}>
      <div className="fac-eyebrow" style={{ color: t.fg, fontSize: 9 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: t.fg, letterSpacing: '-0.02em', fontFamily: 'var(--fd-mono)' }}>
          {value ? value.toFixed(1) : '—'}
        </span>
        <span style={{ fontSize: 11, color: t.fg, opacity: 0.7 }}>/{max}</span>
      </div>
      <div style={{ marginTop: 8, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: t.fg }} />
      </div>
    </div>
  );
};

const FormulaRow = ({
  label,
  parts,
  total,
  emphasis,
  muted,
}: {
  label: string;
  parts: string[];
  total: string;
  emphasis?: boolean;
  muted?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 10px',
      background: emphasis ? 'var(--fd-brand-100)' : 'rgba(255,255,255,0.5)',
      borderRadius: 8,
      border: `1px solid ${emphasis ? 'var(--fd-brand-100)' : 'var(--fd-line-2)'}`,
      opacity: muted ? 0.75 : 1,
    }}
  >
    <div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: emphasis ? 'var(--fd-brand-600)' : 'var(--fd-text-3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: 11, color: 'var(--fd-text-2)', marginTop: 2 }}>{parts.join(' + ')}</div>
    </div>
    <span
      style={{
        fontFamily: 'var(--fd-mono)',
        fontWeight: 800,
        color: emphasis ? 'var(--fd-brand-600)' : 'var(--fd-text)',
        fontSize: 13,
      }}
    >
      /{total}
    </span>
  </div>
);
