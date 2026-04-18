'use client';

// Placeholder hostel-admin login screen.
// Real authentication is NOT wired up yet — warden credentials will be
// configured later by inserting a row into the hostel_admins table and
// replacing this form's submit handler with the actual auth call.

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Mail, Lock, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';

export default function HostelAdminLoginPage() {
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // No real auth — this is a placeholder until warden credentials are
    // provided. See app/api/hostel/auth/login/route.ts for the backend hook.
    setInfo(
      'Hostel-admin authentication is not yet configured. Credentials will be set up by the administrator.'
    );
  };

  return (
    <div
      className={`ch-themed min-h-screen flex items-center justify-center px-4${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
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
                placeholder="admin@example.com"
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
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 border"
                style={{
                  backgroundColor: 'var(--ch-bg)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-text)',
                }}
              />
            </div>
          </div>

          {info && (
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
              {info}
            </p>
          )}

          <Button
            type="submit"
            disabled={!email.trim() || !password}
            className="w-full bg-[#e05252] hover:bg-[#c94545] text-white h-11"
          >
            Sign In
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
