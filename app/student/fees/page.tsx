'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Send, ImagePlus, X, CheckCircle2, IndianRupee, Clock, CheckCheck, XCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FeePayment {
  id: string;
  amount: number;
  transaction_id: string;
  payment_date: string;
  screenshot_url: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  remarks: string | null;
  created_at: string;
}

export default function StudentFeesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/fees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Load payments error:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      loadPayments();
    }
  }, [isAuthenticated, user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const ext = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user?.id || 'unknown'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, imageFile);

    if (error) {
      console.error('Screenshot upload error:', error);
      throw new Error(error.message || 'Failed to upload screenshot');
    }

    const { data: urlData } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!amount || !transactionId.trim() || !paymentDate || !imageFile) {
      alert('Please fill in all fields and attach a payment screenshot');
      return;
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const screenshotUrl = await uploadScreenshot();
      if (!screenshotUrl) throw new Error('Screenshot upload failed');

      const res = await fetch('/api/student/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          transaction_id: transactionId.trim(),
          payment_date: paymentDate,
          screenshot_url: screenshotUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.details || data?.error || 'Failed to submit payment';
        throw new Error(msg);
      }

      setSubmitted(true);
      setAmount('');
      setTransactionId('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      removeImage();
      loadPayments();
    } catch (err) {
      console.error('Submit error:', err);
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: FeePayment['status']) => {
    const config = {
      Pending: { icon: Clock, bg: 'rgba(234,179,8,0.12)', fg: '#b45309' },
      Verified: { icon: CheckCheck, bg: 'rgba(34,197,94,0.12)', fg: '#15803d' },
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
              Payment Submitted
            </h2>
            <p style={{ color: 'var(--ch-muted)' }}>
              Your payment has been recorded and is pending verification by the office.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#e05252] hover:bg-[#c94545] text-white gap-2 mt-4"
            >
              <Wallet className="w-4 h-4" />
              Submit Another Payment
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
            <Wallet className="w-7 h-7 text-[#e05252]" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Fee Payment
          </h1>
          <p style={{ color: 'var(--ch-muted)' }}>
            Upload your payment screenshot to record a fee payment
          </p>
        </div>

        {/* Submission Form */}
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                Amount (₹) <span className="text-[#e05252]">*</span>
              </label>
              <div className="relative">
                <IndianRupee
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--ch-muted)' }}
                />
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="border pl-9"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                Payment Date <span className="text-[#e05252]">*</span>
              </label>
              <Input
                type="date"
                value={paymentDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="border"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Transaction / Reference ID <span className="text-[#e05252]">*</span>
            </label>
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g., UPI/IMPS/NEFT reference"
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Payment Screenshot <span className="text-[#e05252]">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Payment screenshot"
                  className="max-w-xs max-h-64 rounded-lg border object-contain"
                  style={{ borderColor: 'var(--ch-border)' }}
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-[#e05252]"
                style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Click to upload screenshot (max 5MB)</span>
              </button>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !amount || !transactionId.trim() || !paymentDate || !imageFile}
            className="w-full bg-[#e05252] hover:bg-[#c94545] text-white gap-2 h-11"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Payment'}
          </Button>
        </div>

        {/* Payment History */}
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>
            My Payment History
          </h2>

          {loadingPayments ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
              No payments submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base" style={{ color: 'var(--ch-text)' }}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      {statusBadge(p.status)}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                      Txn: {p.transaction_id} · Paid on {new Date(p.payment_date).toLocaleDateString()}
                    </p>
                    {p.remarks && (
                      <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)' }}>
                        Remarks: {p.remarks}
                      </p>
                    )}
                  </div>
                  <a
                    href={p.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium underline"
                    style={{ color: 'var(--ch-accent)' }}
                  >
                    View Screenshot
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
