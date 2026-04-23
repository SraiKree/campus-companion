'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, FileText, GraduationCap, FileSignature, IndianRupee, Wifi,
  CreditCard, ImageIcon, Receipt, Send, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type ModuleType =
  | 'certificate'
  | 'scholarship'
  | 'letterhead'
  | 'fee_query'
  | 'internet'
  | 'id_card'
  | 'event_media'
  | 'event_bill';

interface Module {
  key: ModuleType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  subTypes?: { value: string; label: string }[];
  extraFields?: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date';
    placeholder?: string;
    required?: boolean;
  }[];
  requiredByLabel?: string;
  attachmentHint?: string;
}

const MODULES: Module[] = [
  {
    key: 'certificate',
    title: 'Certificates',
    description: 'Bonafide, TC, Custodian, Language certificates',
    icon: FileText,
    color: '#3b82f6',
    subTypes: [
      { value: 'Bonafide', label: 'Bonafide' },
      { value: 'Transfer', label: 'Transfer (TC)' },
      { value: 'Custodian', label: 'Custodian' },
      { value: 'Language', label: 'Language' },
    ],
    requiredByLabel: 'Required by',
  },
  {
    key: 'scholarship',
    title: 'Scholarship Particulars',
    description: 'Apply for or update scholarship details',
    icon: GraduationCap,
    color: '#8b5cf6',
    subTypes: [
      { value: 'State Government', label: 'State Government' },
      { value: 'Central Government', label: 'Central Government' },
      { value: 'Private Trust', label: 'Private Trust' },
      { value: 'Minority', label: 'Minority' },
      { value: 'Other', label: 'Other' },
    ],
    extraFields: [
      { key: 'scholarship_name', label: 'Scholarship name', placeholder: 'e.g. ePASS' },
      { key: 'application_number', label: 'Application/Reference number', placeholder: 'If already applied' },
      { key: 'expected_amount', label: 'Expected amount (₹)', type: 'number', placeholder: '25000' },
    ],
    attachmentHint: 'Paste a link to your application document',
  },
  {
    key: 'letterhead',
    title: 'Letter Heads',
    description: 'Request official college letter head',
    icon: FileSignature,
    color: '#14b8a6',
    subTypes: [
      { value: 'Internship', label: 'For internship' },
      { value: 'Project', label: 'For project work' },
      { value: 'Event', label: 'For event / sponsorship' },
      { value: 'Research', label: 'For research activity' },
      { value: 'Other', label: 'Other' },
    ],
    extraFields: [
      { key: 'addressed_to', label: 'Addressed to', placeholder: 'e.g. HR Manager, Infosys', required: true },
      { key: 'copies_required', label: 'Copies required', type: 'number', placeholder: '1' },
    ],
    requiredByLabel: 'Required by',
  },
  {
    key: 'fee_query',
    title: 'Fees Related Details',
    description: 'Statements, receipts, or questions about fees',
    icon: IndianRupee,
    color: '#22c55e',
    subTypes: [
      { value: 'Fee Statement', label: 'Fee statement' },
      { value: 'Duplicate Receipt', label: 'Duplicate receipt' },
      { value: 'Concession', label: 'Fee concession query' },
      { value: 'Refund', label: 'Refund query' },
      { value: 'Other', label: 'Other' },
    ],
    extraFields: [
      { key: 'semester', label: 'Semester / term', placeholder: 'e.g. Sem 5 2025-26' },
      { key: 'amount_in_question', label: 'Amount in question (₹)', type: 'number' },
    ],
  },
  {
    key: 'internet',
    title: 'Internet Issues',
    description: 'Campus Wi-Fi / LAN connectivity problems',
    icon: Wifi,
    color: '#ef4444',
    subTypes: [
      { value: 'No Connection', label: "Can't connect to Wi-Fi" },
      { value: 'Slow Speed', label: 'Slow speed' },
      { value: 'Login Failure', label: 'Login portal not working' },
      { value: 'Intermittent', label: 'Keeps dropping' },
      { value: 'Blocked Site', label: 'Required site blocked' },
    ],
    extraFields: [
      { key: 'location', label: 'Location', placeholder: 'e.g. Library 2nd floor', required: true },
      { key: 'device', label: 'Device', placeholder: 'e.g. Windows laptop' },
    ],
  },
  {
    key: 'id_card',
    title: 'ID Cards',
    description: 'Issue or reissue of student ID card',
    icon: CreditCard,
    color: '#f59e0b',
    subTypes: [
      { value: 'New', label: 'New issue (first time)' },
      { value: 'Lost', label: 'Reissue — lost' },
      { value: 'Damaged', label: 'Reissue — damaged' },
      { value: 'Name Update', label: 'Name / details update' },
    ],
    extraFields: [
      { key: 'old_id_number', label: 'Old ID number (if any)' },
      { key: 'fir_number', label: 'FIR number (if lost)' },
    ],
    attachmentHint: 'Upload photo URL for new card',
  },
  {
    key: 'event_media',
    title: 'Event Banners / Brochures',
    description: 'Request design of banners or brochures for events',
    icon: ImageIcon,
    color: '#ec4899',
    subTypes: [
      { value: 'Banner', label: 'Banner' },
      { value: 'Brochure', label: 'Brochure' },
      { value: 'Poster', label: 'Poster' },
      { value: 'Standee', label: 'Standee' },
      { value: 'Invitation', label: 'Invitation card' },
    ],
    extraFields: [
      { key: 'event_name', label: 'Event name', required: true },
      { key: 'event_date', label: 'Event date', type: 'date' },
      { key: 'club_name', label: 'Organising club / department' },
      { key: 'size_spec', label: 'Size / spec', placeholder: 'e.g. 6x3 ft' },
    ],
    requiredByLabel: 'Needed by',
    attachmentHint: 'Link to reference design or brief',
  },
  {
    key: 'event_bill',
    title: 'Event Bills',
    description: 'Submit bills for reimbursement of event expenses',
    icon: Receipt,
    color: '#0ea5e9',
    subTypes: [
      { value: 'Food & Refreshments', label: 'Food & refreshments' },
      { value: 'Printing', label: 'Printing' },
      { value: 'Decoration', label: 'Decoration' },
      { value: 'Prizes', label: 'Prizes / momentos' },
      { value: 'Transport', label: 'Transport' },
      { value: 'Other', label: 'Other' },
    ],
    extraFields: [
      { key: 'event_name', label: 'Event name', required: true },
      { key: 'bill_amount', label: 'Total amount (₹)', type: 'number', required: true },
      { key: 'bill_number', label: 'Bill / invoice number' },
      { key: 'vendor_name', label: 'Vendor / shop name' },
      { key: 'bill_date', label: 'Bill date', type: 'date' },
    ],
    attachmentHint: 'Paste a link to the bill photo / PDF',
  },
];

interface RequestRow {
  id: string;
  module_type: ModuleType;
  sub_type: string | null;
  purpose: string;
  description: string | null;
  required_by: string | null;
  details: Record<string, unknown>;
  attachment_url: string | null;
  status: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Completed';
  admin_remarks: string | null;
  created_at: string;
}

export default function StudentAdminAccountsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ModuleType>('all');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadRequests = async () => {
    try {
      setListLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/student/admin-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') loadRequests();
  }, [isAuthenticated, user]);

  const visibleRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.module_type === filter);
  }, [filter, requests]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e05252]/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#e05252]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
              Admin &amp; Accounts
            </h1>
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              Administrative and accounts services — certificates, fees, scholarships, IT, events
            </p>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODULES.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveModule(m)}
              className="text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--ch-card)',
                borderColor: 'var(--ch-border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${m.color}1a` }}
              >
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--ch-text)' }}>
                {m.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
                {m.description}
              </p>
              <div
                className="flex items-center gap-1 text-xs font-semibold mt-3"
                style={{ color: m.color }}
              >
                <Send className="w-3 h-3" />
                <span>Raise request</span>
              </div>
            </button>
          ))}
        </div>

        {/* My Requests */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                My Requests
              </h2>
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                {requests.length} {requests.length === 1 ? 'request' : 'requests'} submitted
              </p>
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as 'all' | ModuleType)}
              className="h-9 rounded-md border px-3 text-xs"
              style={{
                backgroundColor: 'var(--ch-bg)',
                borderColor: 'var(--ch-border)',
                color: 'var(--ch-text)',
              }}
            >
              <option value="all">All modules</option>
              {MODULES.map(m => (
                <option key={m.key} value={m.key}>{m.title}</option>
              ))}
            </select>
          </div>

          {listLoading ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--ch-muted)' }}>
              Loading your requests…
            </p>
          ) : visibleRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                {filter === 'all'
                  ? "You haven't raised any requests yet."
                  : 'No requests in this module yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--ch-muted)' }}>
                    <th className="text-left font-medium py-2 pr-4">Module</th>
                    <th className="text-left font-medium py-2 pr-4">Type</th>
                    <th className="text-left font-medium py-2 pr-4">Purpose</th>
                    <th className="text-left font-medium py-2 pr-4">Submitted</th>
                    <th className="text-left font-medium py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map(r => {
                    const mod = MODULES.find(m => m.key === r.module_type);
                    return (
                      <tr key={r.id} className="border-t" style={{ borderColor: 'var(--ch-border)' }}>
                        <td className="py-2 pr-4" style={{ color: 'var(--ch-text)' }}>
                          <div className="flex items-center gap-2">
                            {mod && (
                              <mod.icon className="w-3.5 h-3.5" style={{ color: mod.color }} />
                            )}
                            <span className="font-medium">{mod?.title || r.module_type}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4" style={{ color: 'var(--ch-muted)' }}>
                          {r.sub_type || '—'}
                        </td>
                        <td className="py-2 pr-4 max-w-xs truncate" style={{ color: 'var(--ch-text)' }}>
                          {r.purpose}
                        </td>
                        <td className="py-2 pr-4" style={{ color: 'var(--ch-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="py-2">
                          <StatusPill status={r.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {activeModule && (
          <RequestDialog
            module={activeModule}
            onClose={() => setActiveModule(null)}
            onSubmitted={() => {
              setActiveModule(null);
              loadRequests();
            }}
          />
        )}
      </div>
    </StudentLayout>
  );
}

function StatusPill({ status }: { status: RequestRow['status'] }) {
  const config: Record<RequestRow['status'], { bg: string; fg: string; icon: React.ElementType }> = {
    'Pending':   { bg: 'rgba(234,179,8,0.15)',  fg: '#ca8a04', icon: Clock },
    'In Review': { bg: 'rgba(59,130,246,0.15)', fg: '#2563eb', icon: AlertCircle },
    'Approved':  { bg: 'rgba(34,197,94,0.15)',  fg: '#16a34a', icon: CheckCircle2 },
    'Rejected':  { bg: 'rgba(220,38,38,0.10)',  fg: '#dc2626', icon: XCircle },
    'Completed': { bg: 'rgba(34,197,94,0.15)',  fg: '#16a34a', icon: CheckCircle2 },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function RequestDialog({
  module, onClose, onSubmitted,
}: {
  module: Module;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [subType, setSubType] = useState(module.subTypes?.[0]?.value || '');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!purpose.trim()) {
      setError('Please enter a purpose');
      return;
    }
    for (const f of module.extraFields || []) {
      if (f.required && !details[f.key]?.trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('No active session');

      const res = await fetch('/api/student/admin-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          module_type: module.key,
          sub_type: subType || null,
          purpose: purpose.trim(),
          description: description.trim() || null,
          required_by: requiredBy || null,
          details,
          attachment_url: attachmentUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
      setTimeout(() => onSubmitted(), 900);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${module.color}1a` }}
            >
              <module.icon className="w-5 h-5" style={{ color: module.color }} />
            </div>
            <div>
              <DialogTitle>{module.title}</DialogTitle>
              <DialogDescription>{module.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-[#16a34a]" />
            <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
              Request submitted successfully
            </p>
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
              You'll see it under "My Requests" below.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {module.subTypes && (
              <Field label="Type" required>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {module.subTypes.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Purpose" required>
              <Input
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Brief reason for this request"
              />
            </Field>

            {(module.extraFields || []).map(f => (
              <Field key={f.key} label={f.label} required={f.required}>
                <Input
                  type={f.type || 'text'}
                  value={details[f.key] || ''}
                  onChange={e => setDetails({ ...details, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                />
              </Field>
            ))}

            <Field label="Additional details">
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Anything else the admin office should know"
                rows={3}
              />
            </Field>

            {module.requiredByLabel && (
              <Field label={module.requiredByLabel}>
                <Input
                  type="date"
                  value={requiredBy}
                  onChange={e => setRequiredBy(e.target.value)}
                />
              </Field>
            )}

            {module.attachmentHint && (
              <Field label="Attachment URL">
                <Input
                  value={attachmentUrl}
                  onChange={e => setAttachmentUrl(e.target.value)}
                  placeholder={module.attachmentHint}
                />
              </Field>
            )}

            {error && (
              <p className="text-sm flex items-center gap-2" style={{ color: '#dc2626' }}>
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: module.color, color: 'white' }}
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--ch-muted)' }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  );
}
