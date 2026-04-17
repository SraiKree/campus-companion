'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Star, CheckCircle2, MessageSquare, BookOpen, Clock, Send,
} from 'lucide-react';

// ── Mock faculty for current semester ────────────────────────────────────────

interface FacultySubject {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
}

const semesterFaculty: FacultySubject[] = [
  { id: 'F01', name: 'Dr. Rao Venkat', subject: 'Artificial Intelligence', subjectCode: 'CS601' },
  { id: 'F02', name: 'Dr. Sunita Devi', subject: 'Data Structures', subjectCode: 'CS301' },
  { id: 'F06', name: 'Dr. Kavitha Reddy', subject: 'Machine Learning', subjectCode: 'CS602' },
  { id: 'F11', name: 'Prof. Arjun Rao', subject: 'DBMS', subjectCode: 'CS401' },
  { id: 'F12', name: 'Prof. Meghana Sri', subject: 'Operating Systems', subjectCode: 'CS402' },
];

// ── Rating criteria ──────────────────────────────────────────────────────────

interface RatingCriteria {
  key: string;
  label: string;
  description: string;
}

const ratingCriteria: RatingCriteria[] = [
  { key: 'teaching', label: 'Teaching Quality', description: 'Clarity of explanation, pace, and depth of coverage' },
  { key: 'knowledge', label: 'Subject Knowledge', description: 'Command over the subject, ability to answer questions' },
  { key: 'punctuality', label: 'Punctuality & Regularity', description: 'On-time arrival, class cancellation frequency' },
  { key: 'interaction', label: 'Student Interaction', description: 'Approachability, doubt-clearing, encouragement' },
  { key: 'materials', label: 'Study Materials', description: 'Quality of notes, PPTs, references provided' },
];

// ── Past feedback (mock) ─────────────────────────────────────────────────────

interface PastFeedback {
  id: string;
  faculty: string;
  subject: string;
  date: string;
  avgRating: number;
}

const pastFeedback: PastFeedback[] = [
  { id: 'FB-001', faculty: 'Dr. Rao Venkat', subject: 'Artificial Intelligence', date: '2026-03-15', avgRating: 4.6 },
  { id: 'FB-002', faculty: 'Prof. Arjun Rao', subject: 'DBMS', date: '2026-03-15', avgRating: 3.8 },
];

// ── Star rating component ────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >
          <Star
            className="h-6 w-6 transition-colors"
            style={{
              fill: star <= (hover || value) ? '#facc15' : 'transparent',
              color: star <= (hover || value) ? '#facc15' : 'var(--ch-muted)',
            }}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm font-medium ml-2" style={{ color: 'var(--ch-text)' }}>
          {value}/5
        </span>
      )}
    </div>
  );
}

function ratingLabel(avg: number) {
  if (avg >= 4.5) return { text: 'Excellent', color: '#22c55e' };
  if (avg >= 3.5) return { text: 'Good', color: '#3b82f6' };
  if (avg >= 2.5) return { text: 'Average', color: '#f59e0b' };
  return { text: 'Needs Improvement', color: '#ef4444' };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FacultyFeedbackPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewPast, setViewPast] = useState<PastFeedback | null>(null);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (!isAuthenticated || user?.role !== 'student') {
    router.push('/');
    return null;
  }

  const currentFaculty = semesterFaculty.find((f) => f.id === selectedFaculty);
  const allRated = selectedFaculty && ratingCriteria.every((c) => ratings[c.key] > 0);
  const avgRating = Object.values(ratings).length > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length)
    : 0;

  const alreadySubmitted = (fId: string) => pastFeedback.some((fb) => {
    const fac = semesterFaculty.find((f) => f.id === fId);
    return fac && fb.faculty === fac.name;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedFaculty('');
        setRatings({});
        setComment('');
      }, 3000);
    }, 1000);
  };

  const setRating = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Faculty Feedback</h1>
          <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
            Rate your faculty for this semester. Your feedback helps improve teaching quality.
          </p>
        </div>

        {/* ── Feedback Form ── */}
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
              Submit Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <p className="text-lg font-semibold" style={{ color: 'var(--ch-text)' }}>Feedback Submitted!</p>
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Thank you for your feedback. It will help improve the teaching experience.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select faculty */}
                <div className="space-y-2">
                  <Label style={{ color: 'var(--ch-text)' }}>Select Faculty / Subject</Label>
                  <Select value={selectedFaculty} onValueChange={(v) => { setSelectedFaculty(v); setRatings({}); }}>
                    <SelectTrigger className="rounded-lg border" style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                      <SelectValue placeholder="Choose a faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterFaculty.map((f) => {
                        const done = alreadySubmitted(f.id);
                        return (
                          <SelectItem key={f.id} value={f.id} disabled={done}>
                            {f.name} — {f.subject} {done ? '(Already submitted)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Faculty info card */}
                {currentFaculty && (
                  <Card className="rounded-xl border" style={{ backgroundColor: 'var(--ch-muted-bg)', borderColor: 'var(--ch-border)' }}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>{currentFaculty.name}</p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{currentFaculty.subject} ({currentFaculty.subjectCode})</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rating criteria */}
                {selectedFaculty && (
                  <div className="space-y-4">
                    <Label style={{ color: 'var(--ch-text)' }}>Rate on the following criteria</Label>
                    {ratingCriteria.map((criteria) => (
                      <div key={criteria.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border" style={{ borderColor: 'var(--ch-border)' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{criteria.label}</p>
                          <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{criteria.description}</p>
                        </div>
                        <StarRating
                          value={ratings[criteria.key] || 0}
                          onChange={(v) => setRating(criteria.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Overall average preview */}
                {avgRating > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--ch-muted-bg)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>Overall Average:</span>
                    <span className="text-lg font-bold" style={{ color: ratingLabel(avgRating).color }}>
                      {avgRating.toFixed(1)}/5
                    </span>
                    <Badge style={{ backgroundColor: ratingLabel(avgRating).color + '15', color: ratingLabel(avgRating).color, borderColor: 'transparent' }}>
                      {ratingLabel(avgRating).text}
                    </Badge>
                  </div>
                )}

                {/* Comments */}
                {selectedFaculty && (
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ch-text)' }}>Additional Comments (Optional)</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share specific feedback, suggestions, or appreciation..."
                      rows={3}
                      className="rounded-lg border"
                      style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                    />
                  </div>
                )}

                {/* Anonymous toggle */}
                {selectedFaculty && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAnonymous(!anonymous)}
                      className="w-10 h-6 rounded-full relative transition-colors"
                      style={{ backgroundColor: anonymous ? 'var(--ch-accent)' : 'var(--ch-muted-bg)' }}
                    >
                      <div
                        className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                        style={{ left: anonymous ? '22px' : '4px' }}
                      />
                    </button>
                    <span className="text-sm" style={{ color: 'var(--ch-text)' }}>
                      Submit anonymously
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      {anonymous ? 'Your identity will not be shared with the faculty' : 'Your name will be visible to the HOD'}
                    </span>
                  </div>
                )}

                {/* Submit */}
                {selectedFaculty && (
                  <Button
                    type="submit"
                    disabled={!allRated || submitting}
                    className="rounded-lg gap-2"
                    style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── Past Submissions ── */}
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
              My Past Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastFeedback.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>You haven't submitted any feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {pastFeedback.map((fb) => {
                  const rl = ratingLabel(fb.avgRating);
                  return (
                    <div
                      key={fb.id}
                      className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ borderColor: 'var(--ch-border)' }}
                      onClick={() => setViewPast(fb)}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{fb.faculty}</p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{fb.subject} &middot; {fb.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>{fb.avgRating.toFixed(1)}</span>
                        </div>
                        <Badge style={{ backgroundColor: rl.color + '15', color: rl.color, borderColor: 'transparent' }}>
                          {rl.text}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past feedback detail modal */}
        <Dialog open={!!viewPast} onOpenChange={() => setViewPast(null)}>
          <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--ch-text)' }}>Feedback Details</DialogTitle>
              <DialogDescription style={{ color: 'var(--ch-muted)' }}>{viewPast?.faculty} — {viewPast?.subject}</DialogDescription>
            </DialogHeader>
            {viewPast && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Faculty</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{viewPast.faculty}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Subject</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{viewPast.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Submitted On</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{viewPast.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Overall Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>{viewPast.avgRating.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--ch-muted)' }}>Criteria Breakdown (mock)</p>
                  {ratingCriteria.map((c) => {
                    const mockVal = Math.max(3, Math.min(5, viewPast.avgRating + (Math.random() - 0.5)));
                    return (
                      <div key={c.key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm" style={{ color: 'var(--ch-text)' }}>{c.label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="h-3.5 w-3.5"
                              style={{ fill: s <= Math.round(mockVal) ? '#facc15' : 'transparent', color: s <= Math.round(mockVal) ? '#facc15' : 'var(--ch-muted)' }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
