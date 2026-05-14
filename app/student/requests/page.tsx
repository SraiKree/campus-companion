'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Send, BookOpen, Building, DollarSign, Eye, ChevronRight, CheckCircle2,
  Clock, Circle, ArrowRight,
} from 'lucide-react';

// ── Approval Routes ──────────────────────────────────────────────────────────

type RequestCategory = 'academic' | 'hostel' | 'financial';

interface ApprovalStep {
  role: string;
  label: string;
}

const APPROVAL_CHAINS: Record<RequestCategory, ApprovalStep[]> = {
  academic: [
    { role: 'faculty', label: 'Faculty' },
    { role: 'hod', label: 'HOD' },
    { role: 'principal', label: 'Principal' },
  ],
  hostel: [
    { role: 'warden', label: 'Warden' },
    { role: 'hostel', label: 'Hostel Head' },
  ],
  financial: [
    { role: 'accounts', label: 'Accounts' },
    { role: 'principal', label: 'Principal' },
  ],
};

const CATEGORY_INFO: Record<RequestCategory, { label: string; icon: React.ElementType; color: string; description: string }> = {
  academic:  { label: 'Academic', icon: BookOpen, color: '#3b82f6', description: 'Course changes, grade reviews, subject-related requests' },
  hostel:    { label: 'Hostel', icon: Building, color: '#8b5cf6', description: 'Room issues, leave, mess, hostel-related requests' },
  financial: { label: 'Financial', icon: DollarSign, color: '#22c55e', description: 'Fee concession, refunds, scholarship requests' },
};

const REQUEST_TYPES: Record<RequestCategory, { value: string; label: string }[]> = {
  academic: [
    { value: 'grade_review', label: 'Grade Review / Revaluation' },
    { value: 'course_change', label: 'Course / Elective Change' },
    { value: 'attendance_appeal', label: 'Attendance Shortage Appeal' },
    { value: 'project_extension', label: 'Project Deadline Extension' },
    { value: 'academic_other', label: 'Other Academic Request' },
  ],
  hostel: [
    { value: 'room_change', label: 'Room Change Request' },
    { value: 'hostel_leave', label: 'Hostel Leave (>2 days)' },
    { value: 'mess_complaint', label: 'Mess / Food Complaint' },
    { value: 'maintenance', label: 'Room Maintenance Issue' },
    { value: 'hostel_other', label: 'Other Hostel Request' },
  ],
  financial: [
    { value: 'fee_concession', label: 'Fee Concession' },
    { value: 'fee_refund', label: 'Fee Refund' },
    { value: 'scholarship', label: 'Scholarship Application' },
    { value: 'financial_other', label: 'Other Financial Request' },
  ],
};

// ── Mock submitted requests ──────────────────────────────────────────────────

type StepStatus = 'completed' | 'current' | 'upcoming';

interface SubmittedRequest {
  id: string;
  category: RequestCategory;
  type: string;
  subject: string;
  description: string;
  date: string;
  steps: { label: string; status: StepStatus }[];
}

const mockRequests: SubmittedRequest[] = [
  {
    id: 'REQ-001', category: 'academic', type: 'grade_review', subject: 'DBMS Mid-2 Revaluation',
    description: 'Requesting revaluation of Mid-2 DBMS paper. Marks seem lower than expected.',
    date: '2026-04-12',
    steps: [
      { label: 'Faculty', status: 'completed' },
      { label: 'HOD', status: 'current' },
      { label: 'Principal', status: 'upcoming' },
    ],
  },
  {
    id: 'REQ-002', category: 'hostel', type: 'hostel_leave', subject: 'Leave for family function',
    description: '5-day leave to attend sister wedding. Parent consent attached.',
    date: '2026-04-14',
    steps: [
      { label: 'Warden', status: 'completed' },
      { label: 'Hostel Head', status: 'current' },
    ],
  },
  {
    id: 'REQ-003', category: 'financial', type: 'fee_concession', subject: 'Partial fee concession request',
    description: 'Father lost job. Requesting 30% fee concession for this semester.',
    date: '2026-04-10',
    steps: [
      { label: 'Accounts', status: 'current' },
      { label: 'Principal', status: 'upcoming' },
    ],
  },
  {
    id: 'REQ-004', category: 'academic', type: 'course_change', subject: 'Elective change: AI to Cyber Security',
    description: 'Want to switch elective from AI to Cyber Security due to career interest.',
    date: '2026-04-08',
    steps: [
      { label: 'Faculty', status: 'completed' },
      { label: 'HOD', status: 'completed' },
      { label: 'Principal', status: 'completed' },
    ],
  },
  {
    id: 'REQ-005', category: 'hostel', type: 'room_change', subject: 'Room change — noisy block',
    description: 'Current room is near the common area. Affecting studies. Requesting quiet block.',
    date: '2026-04-15',
    steps: [
      { label: 'Warden', status: 'current' },
      { label: 'Hostel Head', status: 'upcoming' },
    ],
  },
];

// ── Pipeline visualizer ──────────────────────────────────────────────────────

function ApprovalPipeline({ steps }: { steps: { label: string; status: StepStatus }[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          {step.status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          ) : step.status === 'current' ? (
            <Clock className="h-4 w-4 text-yellow-500 shrink-0 animate-pulse" />
          ) : (
            <Circle className="h-4 w-4 shrink-0" style={{ color: 'var(--ch-muted)' }} />
          )}
          <span
            className="text-xs font-medium"
            style={{
              color: step.status === 'completed' ? '#22c55e' : step.status === 'current' ? '#f59e0b' : 'var(--ch-muted)',
            }}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--ch-muted)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function getOverallStatus(steps: { label: string; status: StepStatus }[]): string {
  if (steps.every((s) => s.status === 'completed')) return 'Approved';
  const currentIdx = steps.findIndex((s) => s.status === 'current');
  if (currentIdx >= 0) return `Pending at ${steps[currentIdx].label}`;
  return 'Pending';
}

// ── Approval chain preview (for the form) ────────────────────────────────────

function ApprovalChainPreview({ category }: { category: RequestCategory | null }) {
  if (!category) return null;
  const chain = APPROVAL_CHAINS[category];
  const info = CATEGORY_INFO[category];
  return (
    <Card className="rounded-xl border border-dashed" style={{ borderColor: info.color + '40', backgroundColor: 'var(--ch-card)' }}>
      <CardContent className="py-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--ch-muted)' }}>Approval Route</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-white text-xs" style={{ backgroundColor: info.color }}>You</Badge>
          {chain.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--ch-muted)' }} />
              <Badge variant="outline" className="text-xs">{step.label}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StudentRequestsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState<RequestCategory | null>(null);
  const [requestType, setRequestType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewReq, setViewReq] = useState<SubmittedRequest | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    if (filterCat === 'all') return mockRequests;
    return mockRequests.filter((r) => r.category === filterCat);
  }, [filterCat]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (!isAuthenticated || user?.role !== 'student') {
    router.push('/');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Mock submission delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // Reset after showing success
      setTimeout(() => {
        setSubmitted(false);
        setCategory(null);
        setRequestType('');
        setSubject('');
        setDescription('');
      }, 3000);
    }, 1000);
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>Raise a Request</h1>
          <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
            Submit a request and it will be automatically routed to the right approval chain.
          </p>
        </div>

        {/* ── Route explanation ── */}
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" style={{ color: 'var(--ch-text)' }}>How Routing Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.entries(CATEGORY_INFO) as [RequestCategory, typeof CATEGORY_INFO[RequestCategory]][]).map(([key, info]) => {
                const Icon = info.icon;
                const chain = APPROVAL_CHAINS[key];
                return (
                  <div key={key} className="flex flex-col gap-2 p-3 rounded-xl border" style={{ borderColor: 'var(--ch-border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: info.color + '15' }}>
                        <Icon className="h-4 w-4" style={{ color: info.color }} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--ch-text)' }}>{info.label}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs" style={{ color: info.color }}>Student</span>
                      {chain.map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" style={{ color: 'var(--ch-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--ch-muted)' }}>{step.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── New Request Form ── */}
        <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--ch-text)' }}>
              <Send className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
              New Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold" style={{ color: 'var(--ch-text)' }}>Request Submitted!</p>
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Your request has been routed to the approval chain.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Step 1: Pick category */}
                <div className="space-y-2">
                  <Label style={{ color: 'var(--ch-text)' }}>Request Category</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.entries(CATEGORY_INFO) as [RequestCategory, typeof CATEGORY_INFO[RequestCategory]][]).map(([key, info]) => {
                      const Icon = info.icon;
                      const selected = category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setCategory(key); setRequestType(''); }}
                          className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all"
                          style={{
                            borderColor: selected ? info.color : 'var(--ch-border)',
                            backgroundColor: selected ? info.color + '08' : 'transparent',
                            boxShadow: selected ? `0 0 0 1px ${info.color}` : 'none',
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: info.color + '15' }}>
                            <Icon className="h-5 w-5" style={{ color: info.color }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--ch-text)' }}>{info.label}</p>
                            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{info.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Approval chain preview */}
                <ApprovalChainPreview category={category} />

                {/* Step 2: Request type */}
                {category && (
                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ch-text)' }}>Request Type</Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger className="rounded-lg border" style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_TYPES[category].map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Step 3: Subject & Description */}
                {requestType && (
                  <>
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--ch-text)' }}>Subject</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief title for your request"
                        required
                        className="rounded-lg border"
                        style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--ch-text)' }}>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain your request in detail..."
                        required
                        rows={4}
                        className="rounded-lg border"
                        style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting || !subject || !description}
                      className="rounded-lg gap-2"
                      style={{ backgroundColor: 'var(--ch-accent)', color: 'white' }}
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── My Requests Tracker ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ch-text)' }}>My Requests</h2>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[180px] rounded-lg border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'var(--ch-border)' }}>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>ID</TableHead>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>Subject</TableHead>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>Category</TableHead>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>Date</TableHead>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>Approval Pipeline</TableHead>
                    <TableHead style={{ color: 'var(--ch-muted)' }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: 'var(--ch-muted)' }}>View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => {
                    const info = CATEGORY_INFO[req.category];
                    const overall = getOverallStatus(req.steps);
                    const isApproved = overall === 'Approved';
                    return (
                      <TableRow key={req.id} style={{ borderColor: 'var(--ch-border)' }}>
                        <TableCell>
                          <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ch-muted-bg)', color: 'var(--ch-text)' }}>{req.id}</code>
                        </TableCell>
                        <TableCell className="font-medium" style={{ color: 'var(--ch-text)' }}>{req.subject}</TableCell>
                        <TableCell>
                          <Badge className="text-white text-xs" style={{ backgroundColor: info.color }}>{info.label}</Badge>
                        </TableCell>
                        <TableCell style={{ color: 'var(--ch-text)' }}>{req.date}</TableCell>
                        <TableCell>
                          <ApprovalPipeline steps={req.steps} />
                        </TableCell>
                        <TableCell>
                          {isApproved ? (
                            <Badge className="bg-green-500/10 text-green-600 border-transparent hover:bg-green-500/10">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-transparent hover:bg-yellow-500/10">{overall}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewReq(req)}>
                            <Eye className="h-4 w-4" style={{ color: 'var(--ch-accent)' }} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── View Request Modal ── */}
        <Dialog open={!!viewReq} onOpenChange={() => setViewReq(null)}>
          <DialogContent style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--ch-text)' }}>{viewReq?.subject}</DialogTitle>
              <DialogDescription style={{ color: 'var(--ch-muted)' }}>{viewReq?.id} &mdash; {viewReq?.date}</DialogDescription>
            </DialogHeader>
            {viewReq && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Category</p>
                    <Badge className="text-white text-xs" style={{ backgroundColor: CATEGORY_INFO[viewReq.category].color }}>
                      {CATEGORY_INFO[viewReq.category].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Type</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                      {REQUEST_TYPES[viewReq.category].find((t) => t.value === viewReq.type)?.label || viewReq.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Submitted</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>{viewReq.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Status</p>
                    <p className="text-sm font-medium" style={{ color: getOverallStatus(viewReq.steps) === 'Approved' ? '#22c55e' : '#f59e0b' }}>
                      {getOverallStatus(viewReq.steps)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ch-muted)' }}>Description</p>
                  <p className="text-sm" style={{ color: 'var(--ch-text)' }}>{viewReq.description}</p>
                </div>

                {/* Detailed pipeline */}
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--ch-muted)' }}>Approval Pipeline</p>
                  <div className="space-y-3">
                    {viewReq.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : step.status === 'current' ? (
                            <Clock className="h-6 w-6 text-yellow-500" />
                          ) : (
                            <Circle className="h-6 w-6" style={{ color: 'var(--ch-muted)' }} />
                          )}
                          {i < viewReq.steps.length - 1 && (
                            <div className="w-px h-4 mt-1" style={{ backgroundColor: step.status === 'completed' ? '#22c55e' : 'var(--ch-border)' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{
                            color: step.status === 'completed' ? '#22c55e' : step.status === 'current' ? '#f59e0b' : 'var(--ch-muted)',
                          }}>
                            {step.label}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                            {step.status === 'completed' ? 'Approved' : step.status === 'current' ? 'Reviewing...' : 'Waiting'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
