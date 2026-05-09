'use client';

import './../faculty-design.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import FacultyLayout from '@/components/layout/FacultyLayout';
import { X, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  class_name?: string | null;
  deadline?: string | null;
  total_marks?: number | null;
  description?: string | null;
  created_at?: string | null;
  submission_count?: number;
  pending_reviews?: number;
  graded_count?: number;
}

interface Submission {
  student_id: string;
  student_name: string;
  submitted_at: string;
  file_url?: string | null;
  marks?: number | null;
  feedback?: string | null;
}

type AssignmentStatus = 'open' | 'grading' | 'returned';

const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();

// Derive a status pill from submission counts. "Open" = no submissions yet OR deadline still in future and nothing graded;
// "Grading" = there are submissions and at least one is ungraded; "Returned" = every submission graded.
const deriveStatus = (a: Assignment): AssignmentStatus => {
  const total = a.submission_count ?? 0;
  const graded = a.graded_count ?? 0;
  const pending = a.pending_reviews ?? 0;
  if (total === 0) return 'open';
  if (pending === 0 && graded === total) return 'returned';
  return 'grading';
};

const fmtDeadline = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtRel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Hard-deadline countdown text + tone for the assignment-rail card
const deadlineLabel = (iso?: string | null) => {
  if (!iso) return { text: 'No deadline', tone: 'muted' as const };
  const dl = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.round((dl - now) / 86400000);
  if (days > 2) return { text: `Due in ${days}d`, tone: 'green' as const };
  if (days > 0) return { text: `Due in ${days}d`, tone: 'amber' as const };
  if (days === 0) return { text: 'Due today', tone: 'amber' as const };
  return { text: `Closed ${-days}d ago`, tone: 'muted' as const };
};

const StatusPill = ({ status }: { status: AssignmentStatus }) => {
  const map: Record<AssignmentStatus, { cls: string; label: string }> = {
    open: { cls: 'fac-pill-amber', label: 'Open' },
    grading: { cls: 'fac-pill-purple', label: 'Grading' },
    returned: { cls: 'fac-pill-green', label: 'Returned' },
  };
  const m = map[status];
  return (
    <span className={`fac-pill ${m.cls}`} style={{ fontSize: 9, padding: '2px 7px' }}>
      {m.label}
    </span>
  );
};

const SubStatePill = ({ state }: { state: 'submitted' | 'late' | 'graded' | 'pending' }) => {
  const map = {
    submitted: { bg: 'var(--fd-brand-100)', fg: 'var(--fd-brand-600)', label: '● On Time' },
    late: { bg: 'var(--fd-amber-100)', fg: 'var(--fd-amber-600)', label: '● Late' },
    graded: { bg: 'var(--fd-purple-100)', fg: 'var(--fd-purple-600)', label: '● Graded' },
    pending: { bg: 'var(--fd-surface-2)', fg: 'var(--fd-text-3)', label: '○ Pending' },
  } as const;
  const m = map[state];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        background: m.bg,
        color: m.fg,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {m.label}
    </span>
  );
};

const Meta = ({ label, value, accent }: { label: string; value: string; accent?: 'brand' | 'purple' }) => {
  const colors = { brand: 'var(--fd-brand-600)', purple: 'var(--fd-purple-600)' } as const;
  return (
    <div>
      <div className="fac-eyebrow" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          marginTop: 4,
          color: accent ? colors[accent] : 'var(--fd-text)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
};

// ── Numeric mark input (rubric/grade cell) — mirrors the design's clamping/validation. ──
const MarkInput = ({
  value,
  max,
  disabled,
  onCommit,
}: {
  value: number | null | undefined;
  max: number;
  disabled?: boolean;
  onCommit: (v: number | null) => void;
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

export default function FacultyAssignmentsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; department: string; section: string; subject_name?: string; subject_code?: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'grading' | 'returned'>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openSubId, setOpenSubId] = useState<string | null>(null);

  const cur = useMemo(() => assignments.find(a => a.id === activeId) || null, [assignments, activeId]);
  const openSub = useMemo(
    () => (openSubId ? submissions.find(s => s.student_id === openSubId) || null : null),
    [openSubId, submissions],
  );

  // Auth gate
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'faculty') router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  // Initial fetch — assignments + classes
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      void fetchAssignments();
      void fetchClasses();
    }
  }, [loading, isAuthenticated, user]);

  // When the active assignment changes, fetch its submissions
  useEffect(() => {
    if (cur) void fetchSubmissions(cur.id);
    else setSubmissions([]);
  }, [activeId]);

  const getToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token || null;
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/faculty/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load assignments');
      }
      const data = await res.json();
      const list: Assignment[] = Array.isArray(data?.assignments) ? data.assignments : [];
      setAssignments(list);
      if (!activeId && list.length > 0) setActiveId(list[0].id);
    } catch (err) {
      toast.error((err as Error)?.message || 'Unable to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await getToken();
      if (!token || !user?.id) return;
      const res = await fetch(`/api/faculty/classes?facultyId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setClasses(Array.isArray(data?.classes) ? data.classes : []);
    } catch {
      // non-fatal
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/faculty/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to load submissions');
      }
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGrade = async (studentId: string, marks: number | null, feedback: string | null) => {
    if (!cur) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/faculty/assignments/${cur.id}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId, marks, feedback }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save grade');
      }
      // Optimistically update the local submission
      setSubmissions(list =>
        list.map(s => (s.student_id === studentId ? { ...s, marks, feedback } : s)),
      );
      // Refresh assignment counters
      void fetchAssignments();
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to save grade');
    }
  };

  // Derived per-row submission states
  const decoratedSubs = useMemo(() => {
    if (!cur) return [];
    const dl = cur.deadline ? new Date(cur.deadline).getTime() : null;
    return submissions.map(s => {
      const submittedTs = s.submitted_at ? new Date(s.submitted_at).getTime() : null;
      const isLate = dl != null && submittedTs != null && submittedTs > dl;
      const isGraded = s.marks != null;
      const state: 'submitted' | 'late' | 'graded' | 'pending' = isGraded
        ? 'graded'
        : submittedTs == null
        ? 'pending'
        : isLate
        ? 'late'
        : 'submitted';
      return { ...s, state, isLate };
    });
  }, [submissions, cur]);

  // Filtered list of assignments for the rail
  const visibleAssignments = useMemo(() => {
    return assignments.filter(a => (filter === 'all' ? true : deriveStatus(a) === filter));
  }, [assignments, filter]);

  // Aggregate stats for the active assignment
  const counts = useMemo(() => {
    const c = { submitted: 0, late: 0, graded: 0 };
    decoratedSubs.forEach(s => {
      if (s.state === 'late') c.late += 1;
      if (s.state === 'submitted') c.submitted += 1;
      if (s.state === 'graded') c.graded += 1;
    });
    return c;
  }, [decoratedSubs]);

  const maxScore = cur?.total_marks ?? 100;
  const classAvg = useMemo(() => {
    const graded = decoratedSubs.filter(s => s.marks != null);
    if (graded.length === 0) return 0;
    return graded.reduce((a, s) => a + (s.marks ?? 0), 0) / graded.length;
  }, [decoratedSubs]);

  if (loading || !isAuthenticated || user?.role !== 'faculty') return null;

  return (
    <FacultyLayout>
      <div className="fac-design">
        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="fac-pill fac-pill-cream">Active Assignments · {assignments.length}</span>
            <h1 style={{ margin: '10px 0 4px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--fd-text)' }}>
              Assignments
            </h1>
            <div style={{ color: 'var(--fd-text-2)', fontSize: 13 }}>
              Create work with hard deadlines, monitor submissions, and grade with auto-totals.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="fac-btn fac-btn-primary" onClick={() => setCreating(true)}>
              + New Assignment
            </button>
          </div>
        </div>

        {loadingAssignments ? (
          <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No assignments yet</div>
            <div style={{ color: 'var(--fd-text-3)', fontSize: 13, marginBottom: 16 }}>
              Create your first assignment to start collecting submissions.
            </div>
            <button type="button" className="fac-btn fac-btn-primary" onClick={() => setCreating(true)}>
              + New Assignment
            </button>
          </div>
        ) : (
          /* ── Two-pane: list rail + detail ── */
          <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
            {/* === Assignment list rail === */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {([
                  { id: 'all', label: 'All', count: assignments.length },
                  { id: 'open', label: 'Open', count: assignments.filter(a => deriveStatus(a) === 'open').length },
                  { id: 'grading', label: 'Grading', count: assignments.filter(a => deriveStatus(a) === 'grading').length },
                  { id: 'returned', label: 'Returned', count: assignments.filter(a => deriveStatus(a) === 'returned').length },
                ] as const).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: `1px solid ${filter === f.id ? 'var(--fd-brand-600)' : 'var(--fd-line)'}`,
                      background: filter === f.id ? 'var(--fd-brand-50)' : 'var(--fd-surface)',
                      color: filter === f.id ? 'var(--fd-brand-600)' : 'var(--fd-text-2)',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {f.label} <span style={{ opacity: 0.6 }}>· {f.count}</span>
                  </button>
                ))}
              </div>

              {visibleAssignments.length === 0 ? (
                <div className="fac-card" style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--fd-text-3)' }}>
                  No assignments match this filter.
                </div>
              ) : (
                visibleAssignments.map(a => {
                  const status = deriveStatus(a);
                  const isActive = a.id === activeId;
                  const dl = deadlineLabel(a.deadline);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setActiveId(a.id);
                        setOpenSubId(null);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: 14,
                        background: isActive ? 'var(--fd-surface)' : 'var(--fd-surface-2)',
                        border: `1px solid ${isActive ? 'var(--fd-brand-600)' : 'var(--fd-line)'}`,
                        borderLeft: isActive ? '3px solid var(--fd-brand-600)' : '1px solid var(--fd-line)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: isActive ? '0 4px 12px rgba(30,157,107,0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: isActive ? 'var(--fd-brand-600)' : 'var(--fd-text-3)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {a.subject || '—'}
                          {a.class_name ? ` · ${a.class_name}` : ''}
                        </span>
                        <StatusPill status={status} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, color: 'var(--fd-text)' }}>
                        {a.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
                        <span
                          style={{
                            color:
                              dl.tone === 'amber'
                                ? 'var(--fd-amber-600)'
                                : dl.tone === 'muted'
                                ? 'var(--fd-text-3)'
                                : 'var(--fd-brand-600)',
                            fontWeight: 700,
                          }}
                        >
                          {dl.text}
                        </span>
                        <span style={{ color: 'var(--fd-text-3)' }}>
                          {a.graded_count ?? 0}/{a.submission_count ?? 0} graded
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* === Detail pane === */}
            {cur ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Header card */}
                <div className="fac-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fd-brand-600)', letterSpacing: '0.06em' }}>
                          {cur.subject || '—'}
                          {cur.class_name ? ` · ${cur.class_name}` : ''}
                        </span>
                        <StatusPill status={deriveStatus(cur)} />
                      </div>
                      <h2 style={{ margin: '2px 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fd-text)' }}>
                        {cur.title}
                      </h2>
                      {cur.description && (
                        <div style={{ fontSize: 13, color: 'var(--fd-text-2)', lineHeight: 1.55, maxWidth: 720 }}>
                          {cur.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10,
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: '1px solid var(--fd-line)',
                    }}
                  >
                    <Meta label="Hard Deadline" value={fmtDeadline(cur.deadline)} accent="brand" />
                    <Meta label="Submitted" value={`${counts.submitted + counts.late + counts.graded} / ${decoratedSubs.length || '—'}`} />
                    <Meta label="Graded" value={`${counts.graded} / ${decoratedSubs.length || '—'}`} />
                    <Meta label="Class Avg" value={`${classAvg.toFixed(1)} / ${maxScore}`} accent="purple" />
                  </div>
                </div>

                {/* Rubric / scoring summary */}
                <div className="fac-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h3 className="fac-card-title">Scoring</h3>
                    <span className="fac-pill fac-pill-muted" style={{ fontSize: 9 }}>
                      Auto-totalled
                    </span>
                  </div>
                  <div
                    style={{
                      background: 'var(--fd-brand-50)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--fd-brand-100)',
                      maxWidth: 240,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fd-brand-600)', letterSpacing: '0.04em' }}>Score</div>
                    <div style={{ fontFamily: 'var(--fd-mono)', fontWeight: 800, marginTop: 4, fontSize: 18, color: 'var(--fd-text)' }}>
                      /{maxScore}
                    </div>
                  </div>
                </div>

                {/* Submissions table */}
                <div className="fac-card fac-card-flush">
                  {loadingSubmissions ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                      Loading submissions…
                    </div>
                  ) : decoratedSubs.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                      No submissions yet for this assignment.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="fac-table" style={{ minWidth: 720 }}>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th style={{ textAlign: 'center' }}>
                              Score
                              <br />
                              <span style={{ color: 'var(--fd-text-3)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                                /{maxScore}
                              </span>
                            </th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {decoratedSubs.map(s => (
                            <tr key={s.student_id}>
                              <td style={{ fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div className="fac-avatar">{initials(s.student_name)}</div>
                                  {s.student_name}
                                </div>
                              </td>
                              <td>
                                <SubStatePill state={s.state} />
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--fd-text-2)' }}>
                                {s.submitted_at ? fmtRel(s.submitted_at) : '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <MarkInput
                                  value={s.marks ?? null}
                                  max={maxScore}
                                  onCommit={v => handleGrade(s.student_id, v, s.feedback ?? null)}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="fac-btn fac-btn-ghost"
                                  style={{ padding: '6px 10px', fontSize: 11 }}
                                  onClick={() => setOpenSubId(s.student_id)}
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="fac-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--fd-text-3)' }}>
                Pick an assignment from the rail to see submissions.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Submission drawer ── */}
      {openSub && cur && (
        <SubmissionDrawer
          submission={openSub}
          assignment={cur}
          onClose={() => setOpenSubId(null)}
          onSave={(marks, feedback) => handleGrade(openSub.student_id, marks, feedback)}
        />
      )}

      {/* ── Create assignment modal ── */}
      {creating && (
        <CreateAssignmentModal
          classes={classes}
          onCancel={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await fetchAssignments();
          }}
        />
      )}
    </FacultyLayout>
  );
}

// ── Submission detail drawer ──────────────────────────────────────────
const SubmissionDrawer = ({
  submission,
  assignment,
  onClose,
  onSave,
}: {
  submission: Submission & { state?: string };
  assignment: Assignment;
  onClose: () => void;
  onSave: (marks: number | null, feedback: string | null) => void;
}) => {
  const max = assignment.total_marks ?? 100;
  const [marks, setMarks] = useState<number | null>(submission.marks ?? null);
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? '');

  return (
    <div onClick={onClose} className="fac-design fac-design-overlay">
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 540,
          maxWidth: '100%',
          height: '100%',
          background: 'var(--fd-surface)',
          borderLeft: '1px solid var(--fd-line)',
          boxShadow: 'var(--fd-shadow-lg)',
          overflowY: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fd-text-3)', letterSpacing: '0.06em' }}>
              {assignment.title}
            </div>
            <h2 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fd-text)' }}>
              {submission.student_name}
            </h2>
            {submission.submitted_at && (
              <span style={{ fontSize: 11, color: 'var(--fd-text-3)' }}>
                Submitted {fmtRel(submission.submitted_at)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="fac-btn fac-btn-ghost"
            style={{ width: 36, height: 36, padding: 0 }}
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File preview row (only shown if there's a file URL) */}
        {submission.file_url && (
          <div className="fac-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--fd-brand-100)',
                color: 'var(--fd-brand-600)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Submitted file
              </div>
              <div style={{ fontSize: 11, color: 'var(--fd-text-3)' }}>
                Uploaded {submission.submitted_at ? fmtRel(submission.submitted_at) : '—'}
              </div>
            </div>
            <a
              className="fac-btn fac-btn-secondary"
              style={{ padding: '8px 12px', fontSize: 12, textDecoration: 'none' }}
              href={submission.file_url}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
          </div>
        )}

        {/* Score input */}
        <div className="fac-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="fac-card-title">Score</h3>
            <span style={{ fontFamily: 'var(--fd-mono)', fontWeight: 800, fontSize: 18, color: marks != null ? 'var(--fd-brand-600)' : 'var(--fd-text-3)' }}>
              {marks != null ? marks : '—'}
              <span style={{ color: 'var(--fd-text-3)', fontSize: 13 }}> / {max}</span>
            </span>
          </div>
          <MarkInput value={marks} max={max} onCommit={v => setMarks(v)} />
          <div style={{ height: 4, background: 'var(--fd-line-2)', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
            <div
              style={{
                width: `${marks != null ? Math.min(100, (marks / max) * 100) : 0}%`,
                height: '100%',
                background: 'var(--fd-brand-500)',
              }}
            />
          </div>
        </div>

        {/* Feedback */}
        <div className="fac-card" style={{ padding: 16 }}>
          <h3 className="fac-card-title">Feedback to Student</h3>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Optional notes for the student…"
            style={{
              width: '100%',
              marginTop: 10,
              minHeight: 100,
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 13,
              border: '1px solid var(--fd-line)',
              borderRadius: 10,
              background: 'var(--fd-surface)',
              color: 'var(--fd-text)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
          <button type="button" onClick={onClose} className="fac-btn fac-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            className="fac-btn fac-btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              onSave(marks, feedback || null);
              onClose();
            }}
          >
            Save Grade
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Create assignment modal ──────────────────────────────────────────
const CreateAssignmentModal = ({
  classes,
  onCancel,
  onCreated,
}: {
  classes: Array<{ id: string; department: string; section: string; subject_name?: string; subject_code?: string }>;
  onCancel: () => void;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valid = title.trim() && subject.trim() && (className && className !== '__custom' ? true : !!customClass.trim());

  const submit = async () => {
    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const finalClass = className === '__custom' ? customClass : className;
      const res = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          subject,
          class_name: finalClass,
          deadline: deadline || null,
          total_marks: totalMarks ? Number(totalMarks) : null,
          description: description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create assignment');
      }
      toast.success('Assignment created');
      onCreated();
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onCancel} className="fac-design fac-design-modal-overlay">
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--fd-surface)',
          borderRadius: 18,
          boxShadow: 'var(--fd-shadow-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="fac-pill fac-pill-cream">New Work</span>
            <h2 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--fd-text)' }}>
              Create Assignment
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="fac-btn fac-btn-ghost"
            style={{ width: 36, height: 36, padding: 0 }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Field label="Title">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Recursion Practice Set"
            className="fac-input"
          />
        </Field>

        <Field label="Subject">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            className="fac-input"
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Class">
            {classes.length > 0 ? (
              <>
                <select
                  className="fac-input"
                  value={className}
                  onChange={e => {
                    setClassName(e.target.value);
                    if (e.target.value !== '__custom') setCustomClass('');
                  }}
                >
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.section}>
                      {c.department ? `${c.department} - ${c.section}` : c.section}
                    </option>
                  ))}
                  <option value="__custom">Other / custom</option>
                </select>
                {className === '__custom' && (
                  <input
                    value={customClass}
                    onChange={e => setCustomClass(e.target.value)}
                    placeholder="Custom class (e.g. CSE-A)"
                    className="fac-input"
                    style={{ marginTop: 8 }}
                  />
                )}
              </>
            ) : (
              <input
                value={customClass}
                onChange={e => {
                  setCustomClass(e.target.value);
                  setClassName('__custom');
                }}
                placeholder="Class (e.g. CSE-A)"
                className="fac-input"
              />
            )}
          </Field>

          <Field label="Hard Deadline">
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="fac-input"
            />
          </Field>
        </div>

        <Field label="Total Marks">
          <input
            type="number"
            min={1}
            value={totalMarks}
            onChange={e => setTotalMarks(e.target.value)}
            className="fac-input"
            style={{ maxWidth: 140 }}
          />
        </Field>

        <Field label="Brief">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="fac-input"
            style={{ minHeight: 80, resize: 'vertical' }}
            placeholder="What students need to do, deliverables, format…"
          />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onCancel} className="fac-btn fac-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="fac-btn fac-btn-primary"
            style={{ flex: 1 }}
            disabled={!valid || submitting}
          >
            {submitting ? 'Saving…' : 'Create & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="fac-eyebrow" style={{ marginBottom: 6 }}>
      {label}
    </div>
    {children}
  </div>
);
