'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { supabase } from '@/lib/supabase';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Send, BookOpen, Building, DollarSign, Eye, ChevronRight, CheckCircle2,
  Clock, Circle, ArrowRight, CalendarDays, Plus, X, Paperclip, FileText, Trash2,
} from 'lucide-react';

const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ATTACHMENT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

// ─── Leave / Gate Pass tab ───────────────────────────────────────────────────

interface LeaveRequest {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const LEAVE_STATUS_COLORS: Record<LeaveRequest['status'], string> = {
  pending: '#f59e0b',
  approved: '#16a34a',
  rejected: '#dc2626',
};

function LeaveTab() {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ reason: '', fromDate: '', toDate: '' });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const load = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/student/leave-requests', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(Array.isArray(data.leaveRequests) ? data.leaveRequests : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.reason.trim() || !form.fromDate || !form.toDate) {
      toast({ title: 'Missing fields', description: 'Reason, from and to dates are required.', variant: 'destructive' });
      return;
    }
    if (new Date(form.fromDate).getTime() > new Date(form.toDate).getTime()) {
      toast({ title: 'Invalid dates', description: 'From date cannot be after to date.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ reason: form.reason.trim(), fromDate: form.fromDate, toDate: form.toDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      toast({ title: 'Submitted', description: 'Your leave request has been sent for review.' });
      setShowForm(false);
      setForm({ reason: '', fromDate: '', toDate: '' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const daysBetween = (from: string, to: string) => {
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    return Math.round((b - a) / 86400000) + 1;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
            Submit a leave or gate-pass request to your class incharge. Track approval status below.
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Close' : 'New Request'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-xl border p-4 space-y-3"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>Reason *</Label>
            <Textarea
              required
              rows={5}
              placeholder="Explain why you need leave"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>From date *</Label>
              <Input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase" style={{ color: 'var(--ch-muted)' }}>To date *</Label>
              <Input
                type="date"
                required
                min={form.fromDate || new Date().toISOString().slice(0, 10)}
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="gap-2">
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      )}

      {fetching ? (
        <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>You haven&apos;t submitted any leave requests yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border p-4"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <div className="flex justify-between items-start mb-2 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold line-clamp-2" style={{ color: 'var(--ch-text)' }}>{r.reason}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
                    {new Date(r.from_date).toLocaleDateString()} → {new Date(r.to_date).toLocaleDateString()}
                    {' · '}
                    {daysBetween(r.from_date, r.to_date)} day(s)
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium uppercase shrink-0"
                  style={{ backgroundColor: `${LEAVE_STATUS_COLORS[r.status]}20`, color: LEAVE_STATUS_COLORS[r.status] }}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                Applied {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Other Requests tab (academic / hostel / financial) ──────────────────────

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

function OtherRequestsTab() {
  const [category, setCategory] = useState<RequestCategory | null>(null);
  const [requestType, setRequestType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewReq, setViewReq] = useState<SubmittedRequest | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAttachmentError(null);
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!ATTACHMENT_ALLOWED_MIME.includes(file.type)) {
      setAttachmentError('Only JPG, PNG or PDF files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > ATTACHMENT_MAX_BYTES) {
      setAttachmentError('File is larger than 5 MB.');
      e.target.value = '';
      return;
    }
    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentError(null);
  };

  const filteredRequests = useMemo(() => {
    if (filterCat === 'all') return mockRequests;
    return mockRequests.filter((r) => r.category === filterCat);
  }, [filterCat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setCategory(null);
        setRequestType('');
        setSubject('');
        setDescription('');
        setAttachment(null);
        setAttachmentError(null);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
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

              <ApprovalChainPreview category={category} />

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

                  <div className="space-y-2">
                    <Label style={{ color: 'var(--ch-text)' }}>Supporting document (optional)</Label>
                    {attachment ? (
                      <div
                        className="flex items-center gap-3 rounded-lg border p-3"
                        style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-bg)' }}
                      >
                        <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--ch-accent)' }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--ch-text)' }}>
                            {attachment.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAttachment}
                          className="h-8 w-8 p-0"
                          aria-label="Remove attachment"
                        >
                          <Trash2 className="h-4 w-4" style={{ color: 'var(--ch-muted)' }} />
                        </Button>
                      </div>
                    ) : (
                      <label
                        className="flex items-center gap-3 rounded-lg border border-dashed p-3 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ borderColor: 'var(--ch-border)', backgroundColor: 'var(--ch-bg)' }}
                      >
                        <Paperclip className="h-4 w-4 shrink-0" style={{ color: 'var(--ch-muted)' }} />
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: 'var(--ch-text)' }}>
                            Attach a file
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                            JPG, PNG, or PDF · max 5 MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={handleAttachmentChange}
                        />
                      </label>
                    )}
                    {attachmentError && (
                      <p className="text-xs" style={{ color: '#dc2626' }}>{attachmentError}</p>
                    )}
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
  );
}

// ─── Combined page ───────────────────────────────────────────────────────────

export default function StudentRequestsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get('tab') === 'other' ? 'other' : 'leave';
  const [tab, setTab] = useState<'leave' | 'other'>(initialTab);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
            <CalendarDays className="w-7 h-7" /> Requests
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            Submit leave / gate-pass requests or raise other academic, hostel, and financial requests.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'leave' | 'other')}>
          <TabsList>
            <TabsTrigger value="leave">Leave &amp; Gate Pass</TabsTrigger>
            <TabsTrigger value="other">Other Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="leave">
            <LeaveTab />
          </TabsContent>
          <TabsContent value="other">
            <OtherRequestsTab />
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
