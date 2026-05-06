'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquarePlus, Send, ImagePlus, X, CheckCircle2, ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  COMPLAINT_CATEGORIES, DEPARTMENTS,
  type ComplaintCategory, type Department,
} from '@/lib/complaints';

// Sub-categories shown when the student picks "Hostel" — these mirror the
// problem types previously offered on the hostel complaint flow.
const HOSTEL_PROBLEMS = [
  'Plumbing',
  'Electrical',
  'Internet',
  'Cleanliness',
  'Furniture',
  'Mess / Food',
  'Security',
  'Other',
] as const;
type HostelProblem = (typeof HOSTEL_PROBLEMS)[number];

import StudentLayout from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function StudentComplaintsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [hostelProblem, setHostelProblem] = useState<HostelProblem | ''>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);

    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setImagePreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const urls: string[] = [];
    for (const file of imageFiles) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, file);

      if (error) {
        console.error('Image upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('complaint-images')
        .getPublicUrl(data.path);

      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const isHostel = category === 'Hostel';

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      alert('Please fill in all required fields');
      return;
    }
    if (isHostel && !hostelProblem) {
      alert('Please select the hostel problem');
      return;
    }
    if (!isHostel && !department) {
      alert('Please select your department');
      return;
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const uploadedUrls = await uploadImages();

      // For hostel complaints we don't ask for a department; the API still
      // requires one of DEPARTMENTS, so we attach the student's enrolled
      // department from their profile, and tag the problem in the title.
      const submitDepartment = (isHostel
        ? (user?.department && DEPARTMENTS.includes(user.department as Department)
            ? user.department
            : DEPARTMENTS[0])
        : department) as Department;
      const submitTitle = isHostel
        ? `[Hostel · ${hostelProblem}] ${title.trim()}`
        : title.trim();

      const res = await fetch('/api/student/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: submitTitle,
          description: description.trim(),
          category,
          department: submitDepartment,
          image_urls: uploadedUrls,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.details || data?.error || 'Failed to submit complaint';
        throw new Error(msg);
      }

      // Show success state
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setCategory('');
      setDepartment('');
      setHostelProblem('');
      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      console.error('Submit error:', err);
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
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

  // Success screen after submission
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
              Complaint Submitted
            </h2>
            <p style={{ color: 'var(--ch-muted)' }}>
              Your complaint has been submitted anonymously. Only the Principal & Chairman can view your identity.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#e05252] hover:bg-[#c94545] text-white gap-2 mt-4"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Submit Another
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquarePlus className="w-7 h-7 text-[#e05252]" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Complaint & Suggestion Box
          </h1>
          <p style={{ color: 'var(--ch-muted)' }}>
            Submit anonymous complaints or suggestions to help improve the campus
          </p>
        </div>

        {/* Privacy notice */}
        <div
          className="flex items-start gap-3 rounded-xl border p-4"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
              Your identity is protected
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ch-muted)' }}>
              All complaints are anonymous. Only the Principal & Chairman can view student identity when needed.
              HODs can only see complaints from their department without any identifying information.
            </p>
          </div>
        </div>

        {/* Submission Form */}
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Title <span className="text-[#e05252]">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your complaint"
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Description <span className="text-[#e05252]">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail..."
              className="border"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                Category <span className="text-[#e05252]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">Select category</option>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {isHostel ? (
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                  Problem <span className="text-[#e05252]">*</span>
                </label>
                <select
                  value={hostelProblem}
                  onChange={(e) => setHostelProblem(e.target.value as HostelProblem)}
                  className="w-full h-10 rounded-md border px-3 text-sm"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  <option value="">Select problem</option>
                  {HOSTEL_PROBLEMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                  Department <span className="text-[#e05252]">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full h-10 rounded-md border px-3 text-sm"
                  style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Attach Images <span className="text-xs font-normal" style={{ color: 'var(--ch-muted)' }}>(optional, max 5)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--ch-border)' }}>
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageFiles.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-[#e05252]"
                  style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px]">Add Image</span>
                </button>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !title.trim() ||
              !description.trim() ||
              !category ||
              (isHostel ? !hostelProblem : !department)
            }
            className="w-full bg-[#e05252] hover:bg-[#c94545] text-white gap-2 h-11"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
}
