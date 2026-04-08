'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/layout/StudentLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  User, Users, Shield, MapPin, FileText,
  ChevronRight, ChevronLeft, Check, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
interface FormData {
  full_name: string;
  gender: string;
  department: string;
  nature_of_work: string;
  designation: string;
  date_of_birth: string;
  father_name: string;
  mother_name: string;
  religion: string;
  caste: string;
  category: string;
  category_telangana: string;
  special_category: string;
  permanent_address: string;
  communication_address: string;
  mobile_no: string;
  email_address: string;
  pan_no: string;
  aadhar_no: string;
  apaar_id: string;
  abha_no: string;
}

const INITIAL: FormData = {
  full_name: '', gender: '', department: '', nature_of_work: '', designation: '',
  date_of_birth: '', father_name: '', mother_name: '', religion: '', caste: '',
  category: '', category_telangana: '', special_category: '',
  permanent_address: '', communication_address: '', mobile_no: '', email_address: '',
  pan_no: '', aadhar_no: '', apaar_id: '', abha_no: '',
};

// ─── Step definitions ─────────────────────────────────────────────────
const STEPS = [
  { title: 'Personal', subtitle: 'Basic information', icon: User },
  { title: 'Family', subtitle: 'Family details', icon: Users },
  { title: 'Category', subtitle: 'Reservation info', icon: Shield },
  { title: 'Contact', subtitle: 'Address & phone', icon: MapPin },
  { title: 'Documents', subtitle: 'ID numbers', icon: FileText },
] as const;

// ─── Dropdown Options ─────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  'Scheduled Castes (SC)',
  'Scheduled Tribes (ST)',
  'OBC-NCL (Other Backward Classes - Non-Creamy Layer)',
  'General ( Unreserved Category )',
];

const CATEGORY_TS_OPTIONS = [
  'Scheduled Castes - A (SC - A)',
  'Scheduled Castes - B (SC - B)',
  'Scheduled Castes - C (SC - C)',
  'Scheduled Tribes (ST)',
  'Backward Classes - A (BC- A)',
  'Backward Classes - B (BC- B)',
  'Backward Classes - C (BC- C)',
  'Backward Classes - D (BC- D)',
  'Backward Classes - E (BC- E)',
  'General ( Unreserved Category )',
  'Not Applicable (NA)',
];

const SPECIAL_CATEGORY_OPTIONS = [
  'EWS ( Economically Weaker Sections )',
  'PwD ( Persons with Disability - Horizontal Reservation)',
  'Ex-Serviceman',
  'NA (Not Applicable)',
];

// ─── Validation per step ──────────────────────────────────────────────
function validateStep(step: number, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  const req = (key: keyof FormData, label: string) => {
    if (!data[key]?.trim()) errors[key] = `${label} is required`;
  };
  const blockLetters = (key: keyof FormData, label: string) => {
    if (data[key] && data[key] !== data[key].toUpperCase()) errors[key] = `${label} must be in BLOCK LETTERS`;
  };

  switch (step) {
    case 0:
      req('full_name', 'Full Name'); blockLetters('full_name', 'Full Name');
      req('gender', 'Gender');
      req('department', 'Department');
      req('nature_of_work', 'Nature of work');
      req('designation', 'Designation');
      req('date_of_birth', 'Date of Birth');
      break;
    case 1:
      req('father_name', "Father's Name"); blockLetters('father_name', "Father's Name");
      req('mother_name', "Mother's Name"); blockLetters('mother_name', "Mother's Name");
      req('religion', 'Religion');
      req('caste', 'Caste');
      break;
    case 2:
      req('category', 'Category');
      req('category_telangana', 'Category (Telangana)');
      req('special_category', 'Special Category');
      break;
    case 3:
      req('permanent_address', 'Permanent Address');
      req('communication_address', 'Communication Address');
      req('mobile_no', 'Mobile No');
      if (data.mobile_no && !/^\d{10}$/.test(data.mobile_no)) errors.mobile_no = 'Must be 10 digits';
      req('email_address', 'Email');
      if (data.email_address && !/\S+@\S+\.\S+/.test(data.email_address)) errors.email_address = 'Invalid email';
      break;
    case 4:
      req('pan_no', 'PAN No');
      if (data.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan_no)) errors.pan_no = 'Invalid PAN format (e.g. ABCDE1234F)';
      req('aadhar_no', 'Aadhar No');
      if (data.aadhar_no && !/^\d{12}$/.test(data.aadhar_no)) errors.aadhar_no = 'Must be 12 digits without spaces';
      req('abha_no', 'ABHA No');
      break;
  }
  return errors;
}

// ─── Reusable field components ────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-[#1a1a1a]">
        {label}{required && <span className="text-[#e05252] ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-[#e05252] font-medium">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, error, uppercase, ...props }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string; uppercase?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      placeholder={placeholder}
      className={`h-11 rounded-xl border text-sm font-medium transition-colors bg-white text-[#1a1a1a] placeholder:text-[#999] ${
        error ? 'border-[#e05252] focus:ring-[#e05252]/20' : 'border-[#e5e5e5] focus:border-[#e05252] focus:ring-[#e05252]/20'
      }`}
      {...props}
    />
  );
}

function SelectField({ value, onChange, placeholder, options, error }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; error?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-11 rounded-xl border text-sm font-medium bg-white text-[#1a1a1a] ${
          error ? 'border-[#e05252]' : 'border-[#e5e5e5]'
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border-[#e5e5e5] rounded-xl">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function StudentDetailsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load existing data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'student') {
      (async () => {
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (!token) return;
          const res = await fetch('/api/student/details', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const { details } = await res.json();
            if (details) {
              setHasExisting(true);
              setForm({
                full_name: details.full_name || '',
                gender: details.gender || '',
                department: details.department || '',
                nature_of_work: details.nature_of_work || '',
                designation: details.designation || '',
                date_of_birth: details.date_of_birth || '',
                father_name: details.father_name || '',
                mother_name: details.mother_name || '',
                religion: details.religion || '',
                caste: details.caste || '',
                category: details.category || '',
                category_telangana: details.category_telangana || '',
                special_category: details.special_category || '',
                permanent_address: details.permanent_address || '',
                communication_address: details.communication_address || '',
                mobile_no: details.mobile_no || '',
                email_address: details.email_address || '',
                pan_no: details.pan_no || '',
                aadhar_no: details.aadhar_no || '',
                apaar_id: details.apaar_id || '',
                abha_no: details.abha_no || '',
              });
            }
          }
        } catch (err) {
          console.error('Error loading details:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [authLoading, isAuthenticated, user]);

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setDirection('next');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setErrors({});
    setDirection('prev');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/student/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save');
      }

      toast({ title: 'Saved!', description: 'Your details have been saved successfully.' });
      setHasExisting(true);
      router.push('/student/profile');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4" />
            <p className="text-[#666]">Loading...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── Step content renderers ──────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Field label="Name in Full (Block Letters only)" required error={errors.full_name}>
                <TextInput value={form.full_name} onChange={(v) => set('full_name', v)} placeholder="JOHN DOE" uppercase error={errors.full_name} />
              </Field>
            </div>
            <Field label="Gender" required error={errors.gender}>
              <SelectField value={form.gender} onChange={(v) => set('gender', v)} placeholder="Select gender" options={['Male', 'Female']} error={errors.gender} />
            </Field>
            <Field label="Department" required error={errors.department}>
              <TextInput value={form.department} onChange={(v) => set('department', v)} placeholder="e.g. CSE" error={errors.department} />
            </Field>
            <Field label="Nature of Work" required error={errors.nature_of_work}>
              <TextInput value={form.nature_of_work} onChange={(v) => set('nature_of_work', v)} placeholder="e.g. Student" error={errors.nature_of_work} />
            </Field>
            <Field label="Designation" required error={errors.designation}>
              <TextInput value={form.designation} onChange={(v) => set('designation', v)} placeholder="e.g. UG Student" error={errors.designation} />
            </Field>
            <div className="col-span-2">
              <Field label="Date of Birth" required error={errors.date_of_birth}>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set('date_of_birth', e.target.value)}
                  className={`h-11 rounded-xl border text-sm font-medium bg-white text-[#1a1a1a] ${
                    errors.date_of_birth ? 'border-[#e05252]' : 'border-[#e5e5e5]'
                  }`}
                />
              </Field>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Field label="Father's Name (Block Letters only)" required error={errors.father_name}>
                <TextInput value={form.father_name} onChange={(v) => set('father_name', v)} placeholder="FATHER NAME" uppercase error={errors.father_name} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Mother's Name (Block Letters only)" required error={errors.mother_name}>
                <TextInput value={form.mother_name} onChange={(v) => set('mother_name', v)} placeholder="MOTHER NAME" uppercase error={errors.mother_name} />
              </Field>
            </div>
            <Field label="Religion" required error={errors.religion}>
              <TextInput value={form.religion} onChange={(v) => set('religion', v)} placeholder="e.g. Hindu" error={errors.religion} />
            </Field>
            <Field label="Caste" required error={errors.caste}>
              <TextInput value={form.caste} onChange={(v) => set('caste', v)} placeholder="e.g. OC" error={errors.caste} />
            </Field>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <Field label="Category" required error={errors.category}>
              <SelectField value={form.category} onChange={(v) => set('category', v)} placeholder="Select category" options={CATEGORY_OPTIONS} error={errors.category} />
            </Field>
            <Field label="Category (as per Govt of Telangana)" required error={errors.category_telangana}>
              <SelectField value={form.category_telangana} onChange={(v) => set('category_telangana', v)} placeholder="Select Telangana category" options={CATEGORY_TS_OPTIONS} error={errors.category_telangana} />
            </Field>
            <Field label="Special Category" required error={errors.special_category}>
              <SelectField value={form.special_category} onChange={(v) => set('special_category', v)} placeholder="Select special category" options={SPECIAL_CATEGORY_OPTIONS} error={errors.special_category} />
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <Field label="Permanent Address" required error={errors.permanent_address}>
              <Textarea
                value={form.permanent_address}
                onChange={(e) => set('permanent_address', e.target.value)}
                placeholder="Enter your permanent address"
                rows={3}
                className={`rounded-xl border text-sm font-medium bg-white text-[#1a1a1a] resize-none ${
                  errors.permanent_address ? 'border-[#e05252]' : 'border-[#e5e5e5]'
                }`}
              />
            </Field>
            <Field label="Address for Communication" required error={errors.communication_address}>
              <Textarea
                value={form.communication_address}
                onChange={(e) => set('communication_address', e.target.value)}
                placeholder="Enter communication address"
                rows={3}
                className={`rounded-xl border text-sm font-medium bg-white text-[#1a1a1a] resize-none ${
                  errors.communication_address ? 'border-[#e05252]' : 'border-[#e5e5e5]'
                }`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Mobile No." required error={errors.mobile_no}>
                <TextInput value={form.mobile_no} onChange={(v) => set('mobile_no', v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" error={errors.mobile_no} />
              </Field>
              <Field label="Email Address" required error={errors.email_address}>
                <TextInput value={form.email_address} onChange={(v) => set('email_address', v)} placeholder="student@email.com" type="email" error={errors.email_address} />
              </Field>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 gap-5">
            <Field label="PAN No." required error={errors.pan_no}>
              <TextInput value={form.pan_no} onChange={(v) => set('pan_no', v.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" uppercase error={errors.pan_no} />
            </Field>
            <Field label="Aadhar No. (without spaces)" required error={errors.aadhar_no}>
              <TextInput value={form.aadhar_no} onChange={(v) => set('aadhar_no', v.replace(/\D/g, '').slice(0, 12))} placeholder="123456789012" error={errors.aadhar_no} />
            </Field>
            <Field label="APAAR ID" error={errors.apaar_id}>
              <TextInput value={form.apaar_id} onChange={(v) => set('apaar_id', v)} placeholder="Optional" error={errors.apaar_id} />
            </Field>
            <Field label="ABHA No." required error={errors.abha_no}>
              <TextInput value={form.abha_no} onChange={(v) => set('abha_no', v)} placeholder="Enter ABHA number" error={errors.abha_no} />
            </Field>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">
            {hasExisting ? 'Update Your Details' : 'Complete Your Profile'}
          </h1>
          <p className="text-sm text-[#666] mt-1">
            Fill in all required fields across {STEPS.length} steps. Your information is stored securely.
          </p>
        </div>

        {/* Stepper Track */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 mb-6">
          {/* Step indicators */}
          <div className="flex items-center justify-between relative mb-2">
            {/* Connecting line behind icons */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#e5e5e5]" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-[#e05252] transition-all duration-500 ease-out"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isCompleted = idx < step;
              const isCurrent = idx === step;
              const isUpcoming = idx > step;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx < step) {
                      setDirection('prev');
                      setErrors({});
                      setStep(idx);
                    }
                  }}
                  disabled={idx > step}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#e05252] text-white shadow-md shadow-[#e05252]/25'
                        : isCurrent
                        ? 'bg-[#e05252] text-white shadow-lg shadow-[#e05252]/30 scale-110'
                        : 'bg-[#f2f0ed] text-[#999] border-2 border-[#e5e5e5]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold transition-colors ${
                      isCurrent ? 'text-[#e05252]' : isCompleted ? 'text-[#1a1a1a]' : 'text-[#999]'
                    }`}>
                      {s.title}
                    </p>
                    <p className={`text-[10px] hidden sm:block transition-colors ${
                      isCurrent ? 'text-[#e05252]/70' : 'text-[#999]'
                    }`}>
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-[#f2f0ed] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e05252] to-[#c44545] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-[#666] mt-2 text-right uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          {/* Step header */}
          <div className="px-8 pt-7 pb-5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e05252]/10 flex items-center justify-center">
                {(() => { const I = STEPS[step].icon; return <I className="w-5 h-5 text-[#e05252]" />; })()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1a1a1a]">{STEPS[step].title} Information</h2>
                <p className="text-xs text-[#666]">{STEPS[step].subtitle}</p>
              </div>
            </div>
          </div>

          {/* Step body */}
          <div className="px-8 py-7">
            {renderStep()}
          </div>

          {/* Navigation Footer */}
          <div className="px-8 py-5 border-t border-[#e5e5e5] bg-[#f9f8f6] flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={step === 0}
              className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                step === 0
                  ? 'text-[#ccc] cursor-not-allowed'
                  : 'text-[#666] hover:text-[#1a1a1a] hover:bg-white border border-transparent hover:border-[#e5e5e5]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === step ? 'w-6 bg-[#e05252]' : idx < step ? 'w-1.5 bg-[#e05252]/40' : 'w-1.5 bg-[#e5e5e5]'
                  }`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-[#e05252] text-white hover:bg-[#c44545] transition-colors shadow-md shadow-[#e05252]/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-[#e05252] text-white hover:bg-[#c44545] transition-colors shadow-md shadow-[#e05252]/20 disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4" /> Submit</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
