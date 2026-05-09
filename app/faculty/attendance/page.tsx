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
  weekday: number;
  period_start: number;
  period_end: number;
  is_lab: boolean;
  room_number: string;
  academic_year: string;
  semester: string;
}

interface AcademicPeriod {
  year: string;
  semester: string;
  label: string;
}

interface Student {
  roll_number: string;
  name: string;
  department: string;
  section: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
  { number: 1, label: '9:20-10:20' },
  { number: 2, label: '10:20-11:20' },
  { number: 3, label: '11:20-12:20' },
  { number: 4, label: '1:10-2:10' },
  { number: 5, label: '2:10-3:10' },
  { number: 6, label: '3:10-4:10' },
];

// Initials helper for the avatar bubble
const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();

// ── Present / Absent semantic toggle ──────────────────────────────────
const PresentToggle = ({ present, onChange }: { present: boolean; onChange: (p: boolean) => void }) => {
  const trackBg = present ? 'var(--fd-brand-500)' : 'var(--fd-red-100)';
  const trackBorder = present ? 'var(--fd-brand-600)' : 'var(--fd-red-600)';
  const labelColor = present ? 'var(--fd-brand-600)' : 'var(--fd-red-600)';
  return (
    <button
      type="button"
      onClick={() => onChange(!present)}
      role="switch"
      aria-checked={present}
      className="fac-toggle"
    >
      <span
        className="fac-toggle-track"
        style={{ background: trackBg, border: `1px solid ${trackBorder}` }}
      >
        <span className="fac-toggle-thumb" style={{ left: present ? 20 : 2 }} />
      </span>
      <span className="fac-toggle-label" style={{ color: labelColor }}>
        {present ? 'Present' : 'Absent'}
      </span>
    </button>
  );
};

const Tally = ({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' }) => {
  const tones = {
    green: { bg: 'var(--fd-brand-100)', fg: 'var(--fd-brand-600)' },
    red:   { bg: 'var(--fd-red-100)',   fg: 'var(--fd-red-600)' },
  } as const;
  const t = tones[tone];
  return (
    <div style={{ background: t.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, letterSpacing: '-0.02em' }}>{value}</div>
      <div className="fac-eyebrow" style={{ color: t.fg, fontSize: 9, marginTop: 2 }}>{label}</div>
    </div>
  );
};

export default function FacultyAttendancePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<FacultyClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(
    () =>
      students.filter(
        s =>
          s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [students, searchTerm],
  );

  const presentCount = Array.from(attendance.values()).filter(Boolean).length;
  const absentCount = students.length - presentCount;
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'faculty') {
        router.push('/');
      } else {
        fetchAvailablePeriods();
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedPeriod) fetchClasses();
  }, [selectedPeriod]);

  const fetchAvailablePeriods = async () => {
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

  const fetchStudents = async (classData: FacultyClass) => {
    setLoadingStudents(true);
    setSearchTerm('');
    try {
      const res = await fetch(
        `/api/faculty/attendance/students?department=${classData.department}&section=${classData.section}&academicYear=${classData.academic_year}&semester=${classData.semester}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        const map = new Map<string, boolean>();
        (data.students || []).forEach((s: Student) => map.set(s.roll_number, true));
        setAttendance(map);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassSelect = (classData: FacultyClass) => {
    setSelectedClass(classData);
    fetchStudents(classData);
  };

  const toggle = (roll: string) => {
    setAttendance(prev => {
      const next = new Map(prev);
      next.set(roll, !next.get(roll));
      return next;
    });
  };

  const markAll = (present: boolean) => {
    const map = new Map<string, boolean>();
    students.forEach(s => map.set(s.roll_number, present));
    setAttendance(map);
  };

  const handleSave = async () => {
    if (!selectedClass || !user?.id) return;
    setSavingAttendance(true);
    try {
      const attendanceData = Array.from(attendance.entries()).map(([roll, present]) => ({
        student_roll_number: roll,
        status: present ? 'present' : 'absent',
      }));
      const res = await fetch('/api/faculty/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          facultyId: user.id,
          date: new Date().toISOString().split('T')[0],
          academicYear: selectedClass.academic_year,
          semester: selectedClass.semester,
          attendance: attendanceData,
        }),
      });
      if (res.ok) {
        toast.success('Attendance saved');
        setSelectedClass(null);
        setStudents([]);
        setAttendance(new Map());
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const getPeriodLabel = (start: number, end: number) =>
    start === end
      ? `P${start} · ${PERIODS[start - 1]?.label}`
      : `P${start}–P${end} · ${PERIODS[start - 1]?.label}`;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (loading || !isAuthenticated || user?.role !== 'faculty') return null;

  return (
    <FacultyLayout>
      <div className="fac-design">
        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="fac-pill fac-pill-cream">Today · {today}</span>
            <h1 style={{ margin: '10px 0 4px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--fd-text)' }}>
              Attendance
            </h1>
            <div style={{ color: 'var(--fd-text-2)', fontSize: 13 }}>
              {selectedClass
                ? 'Toggle present/absent per student. Save when you\'re done.'
                : 'Pick a class to start marking attendance.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {!selectedClass && availablePeriods.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap className="h-4 w-4" style={{ color: 'var(--fd-text-3)' }} />
                <select
                  className="fac-input"
                  style={{ width: 220, padding: '8px 12px' }}
                  value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.semester}` : ''}
                  onChange={(e) => {
                    const [year, semester] = e.target.value.split('-');
                    const p = availablePeriods.find(p => p.year === year && p.semester === semester);
                    if (p) setSelectedPeriod(p);
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
            {selectedClass && (
              <>
                <button
                  type="button"
                  className="fac-btn fac-btn-secondary"
                  onClick={() => {
                    setSelectedClass(null);
                    setStudents([]);
                    setAttendance(new Map());
                  }}
                >
                  Switch Class
                </button>
                <button
                  type="button"
                  className="fac-btn fac-btn-primary"
                  onClick={handleSave}
                  disabled={savingAttendance || loadingStudents}
                >
                  {savingAttendance ? 'Saving…' : 'Save Attendance'}
                </button>
              </>
            )}
          </div>
        </div>

        {loadingPeriods ? (
          <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
            Loading academic periods…
          </div>
        ) : !selectedClass ? (
          /* ── Class chip selector view ── */
          <>
            {loadingClasses ? (
              <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                Loading classes…
              </div>
            ) : classes.length === 0 ? (
              <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No classes found</div>
                <div style={{ color: 'var(--fd-text-3)', fontSize: 13 }}>
                  Add classes in the timetable to start marking attendance.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {classes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="fac-chip"
                    onClick={() => handleClassSelect(c)}
                    style={{ flex: '1 1 240px', maxWidth: 320 }}
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
                      {c.department}-{c.section} · {WEEKDAYS[c.weekday - 1]} · {getPeriodLabel(c.period_start, c.period_end)}
                      {c.room_number ? ` · ${c.room_number}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Roster + analytics view ── */
          <>
            {/* Class chip strip — shows the chosen class plus quick switch row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {classes.map(c => {
                const isActive = c.id === selectedClass.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`fac-chip${isActive ? ' active' : ''}`}
                    onClick={() => handleClassSelect(c)}
                    style={{ minWidth: 200, opacity: isActive ? 1 : 0.65 }}
                  >
                    <span className="fac-chip-code">{c.subject_code}</span>
                    <div className="fac-chip-name">{c.subject_name}</div>
                    <div className="fac-chip-meta">
                      {c.department}-{c.section} · {getPeriodLabel(c.period_start, c.period_end)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
              {/* ── Roster card ── */}
              <div className="fac-card fac-card-flush">
                {/* Card header */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--fd-line)', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 className="fac-card-title">
                      {selectedClass.subject_code} · {selectedClass.subject_name}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--fd-text-3)', marginTop: 3 }}>
                      {selectedClass.department}-{selectedClass.section} · {WEEKDAYS[selectedClass.weekday - 1]} · {getPeriodLabel(selectedClass.period_start, selectedClass.period_end)}
                      {selectedClass.room_number ? ` · ${selectedClass.room_number}` : ''} ·{' '}
                      <span style={{ color: 'var(--fd-brand-600)', fontWeight: 700 }}>
                        {presentCount}/{students.length} present ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <button
                      type="button"
                      className="fac-btn fac-btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 12 }}
                      onClick={() => markAll(true)}
                    >
                      Mark all present
                    </button>
                    <button
                      type="button"
                      className="fac-btn fac-btn-ghost"
                      style={{ padding: '8px 14px', fontSize: 12 }}
                      onClick={() => markAll(false)}
                    >
                      Mark all absent
                    </button>
                  </div>
                </div>

                {/* Table */}
                {loadingStudents ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                    Loading students…
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                    No students found
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="fac-table">
                      <thead>
                        <tr>
                          <th style={{ width: 160 }}>Roll Number</th>
                          <th>Student</th>
                          <th style={{ width: 220, textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(s => {
                          const isPresent = attendance.get(s.roll_number) ?? true;
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
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <PresentToggle
                                    present={isPresent}
                                    onChange={() => toggle(s.roll_number)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Side analytics column ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Live tally */}
                <div className="fac-card">
                  <h3 className="fac-card-title">Today&apos;s Tally</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '12px 0 2px' }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: 'var(--fd-brand-600)', letterSpacing: '-0.025em' }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--fd-text-2)' }}>present</span>
                  </div>
                  <div className="fac-bar" style={{ marginTop: 10 }}>
                    <span style={{ width: `${pct}%`, background: 'var(--fd-brand-500)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                    <Tally label="Present" value={presentCount} tone="green" />
                    <Tally label="Absent" value={absentCount} tone="red" />
                  </div>
                </div>

                {/* Roster meta */}
                <div className="fac-card">
                  <h3 className="fac-card-title">Class Meta</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--fd-text-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--fd-text-3)' }}>Section</span>
                      <span style={{ fontWeight: 700, color: 'var(--fd-text)' }}>
                        {selectedClass.department}-{selectedClass.section}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--fd-text-3)' }}>Period</span>
                      <span style={{ fontWeight: 700, color: 'var(--fd-text)' }}>
                        {getPeriodLabel(selectedClass.period_start, selectedClass.period_end)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--fd-text-3)' }}>Day</span>
                      <span style={{ fontWeight: 700, color: 'var(--fd-text)' }}>
                        {WEEKDAYS[selectedClass.weekday - 1]}
                      </span>
                    </div>
                    {selectedClass.room_number && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--fd-text-3)' }}>Room</span>
                        <span style={{ fontWeight: 700, color: 'var(--fd-text)' }}>
                          {selectedClass.room_number}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--fd-text-3)' }}>Total roster</span>
                      <span style={{ fontWeight: 700, color: 'var(--fd-text)' }}>
                        {students.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* How-to hint */}
                <div className="fac-card" style={{ background: 'var(--fd-brand-50)', borderColor: 'var(--fd-brand-100)' }}>
                  <div className="fac-eyebrow" style={{ color: 'var(--fd-brand-600)' }}>Quick tip</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fd-text-2)', lineHeight: 1.55 }}>
                    Tap the toggle on each row to flip between Present and Absent. The tally on the left updates live. Hit <strong style={{ color: 'var(--fd-brand-600)' }}>Save Attendance</strong> when you&apos;re done — nothing is persisted until then.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </FacultyLayout>
  );
}
