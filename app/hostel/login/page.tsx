'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AccentPicker from '@/components/AccentPicker';

export default function HostelAdminLoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If a hostel-admin is already signed in, skip the form.
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'hostel') {
      router.replace('/hostel/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setSubmitting(true);

    const success = await login(email.trim(), password, 'hostel');

    setSubmitting(false);

    if (success) {
      router.replace('/hostel/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div
      className={`ch-themed min-h-screen flex items-center justify-center px-4 relative${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      <div className="absolute top-6 right-6">
        <AccentPicker />
      </div>
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#e05252]/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-[#e05252]" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>
            Hostel Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
            Sign in to manage hostel students
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--ch-muted)' }}
              />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-10 border"
                style={{
                  backgroundColor: 'var(--ch-bg)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-text)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--ch-muted)' }}
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pl-10 pr-10 border"
                style={{
                  backgroundColor: 'var(--ch-bg)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ch-muted)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-[#e05252]">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="w-full bg-[#e05252] hover:bg-[#c94545] text-white h-11"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: 'var(--ch-muted)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to main login
          </Link>
        </div>
      </div>
    </div>
  );
}
