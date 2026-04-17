'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, Send, CheckCircle2, Clock, CheckCheck, XCircle, FileCheck2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CERTIFICATE_TYPES = [
  'Bonafide', 'Study', 'Conduct', 'Character', 'Transfer', 'No Dues', 'Internship', 'Course Completion',
] as const;
type CertificateType = typeof CERTIFICATE_TYPES[number];

interface CertificateRequest {
  id: string;
  certificate_type: CertificateType;
  purpose: string;
  additional_details: string | null;
  required_by: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Issued';
  remarks: string | null;
  created_at: string;
}

export default function StudentCertificatesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [purpose, setPurpose] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Load requests error:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      loadRequests();
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async () => {
    if (!certificateType || !purpose.trim()) {
      alert('Please select a certificate type and enter the purpose');
      return;
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          certificate_type: certificateType,
          purpose: purpose.trim(),
          additional_details: additionalDetails.trim() || null,
          required_by: requiredBy || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.details || data?.error || 'Failed to submit request';
        throw new Error(msg);
      }

      setSubmitted(true);
      setCertificateType('');
      setPurpose('');
      setAdditionalDetails('');
      setRequiredBy('');
      loadRequests();
    } catch (err) {
      console.error('Submit error:', err);
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: CertificateRequest['status']) => {
    const config = {
      Pending: { icon: Clock, bg: 'rgba(234,179,8,0.12)', fg: '#b45309' },
      Approved: { icon: CheckCheck, bg: 'rgba(34,197,94,0.12)', fg: '#15803d' },
      Issued: { icon: FileCheck2, bg: 'rgba(59,130,246,0.12)', fg: '#1d4ed8' },
      Rejected: { icon: XCircle, bg: 'rgba(224,82,82,0.12)', fg: '#e05252' },
    }[status];
    const Icon = config.icon;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.fg }}
      >
        <Icon className="w-3 h-3" /> {status}
      </span>
    );
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4" />
            <p style={{ color: 'var(--ch-muted)' }}>Loading...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') return null;

  if (submitted) {
    return (
      <StudentLayout>
        <div className="max-w-lg mx-auto mt-12">
          <div
            className="rounded-2xl border p-10 text-center space-y-4 animate-fade-in"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
              Request Submitted
            </h2>
            <p style={{ color: 'var(--ch-muted)' }}>
              Your certificate request has been submitted and is pending approval.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#e05252] hover:bg-[#c94545] text-white gap-2 mt-4"
            >
              <Award className="w-4 h-4" />
              Request Another Certificate
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7 text-[#e05252]" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Apply for Certificate
          </h1>
          <p style={{ color: 'var(--ch-muted)' }}>
            Submit a request for an official certificate from the institution
          </p>
        </div>

        {/* Submission Form */}
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Certificate Type <span className="text-[#e05252]">*</span>
            </label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as CertificateType)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">Select certificate type</option>
              {CERTIFICATE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Purpose <span className="text-[#e05252]">*</span>
            </label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Bank loan application, Passport verification"
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Additional Details <span className="text-xs font-normal" style={{ color: 'var(--ch-muted)' }}>(optional)</span>
            </label>
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={4}
              placeholder="Any additional information to include..."
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Required By <span className="text-xs font-normal" style={{ color: 'var(--ch-muted)' }}>(optional)</span>
            </label>
            <Input
              type="date"
              value={requiredBy}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setRequiredBy(e.target.value)}
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !certificateType || !purpose.trim()}
            className="w-full bg-[#e05252] hover:bg-[#c94545] text-white gap-2 h-11"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>

        {/* Request History */}
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>
            My Certificate Requests
          </h2>

          {loadingRequests ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              No certificate requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-base" style={{ color: 'var(--ch-text)' }}>
                          {r.certificate_type} Certificate
                        </span>
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--ch-text)' }}>
                        {r.purpose}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                    Requested on {new Date(r.created_at).toLocaleDateString()}
                    {r.required_by && ` · Needed by ${new Date(r.required_by).toLocaleDateString()}`}
                  </p>
                  {r.remarks && (
                    <p className="text-xs mt-2 pt-2 border-t" style={{ color: 'var(--ch-muted)', borderColor: 'var(--ch-border)' }}>
                      <span className="font-medium">Remarks:</span> {r.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
