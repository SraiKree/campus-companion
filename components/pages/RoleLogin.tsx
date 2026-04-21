'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserRole } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDashboardPath, ROLE_LABELS } from '@/utils/roles';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';

interface RoleLoginProps {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export default function RoleLogin({ role, title, subtitle, icon: Icon }: RoleLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginStrict, isAuthenticated, user, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Don't auto-redirect while a login is in flight — loginStrict
    // validates the actual role and navigates on its own. Redirecting
    // here races the auth state listener, which sets a temporary
    // user before the real role is resolved.
    if (loading) return;
    if (!authLoading && isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [authLoading, isAuthenticated, user, router, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginStrict(email, password, role);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }
    router.replace(getDashboardPath(role));
  };

  return (
    <div
      className={`ch-themed min-h-screen flex flex-col items-center justify-center p-4 relative${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      <button
        onClick={toggleTheme}
        className="no-transition absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
        style={{
          backgroundColor: 'var(--ch-card)',
          borderColor: 'var(--ch-border)',
          color: isDark ? '#ff8d89' : '#e05252',
        }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-[420px] animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--ch-accent)' }}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--ch-text)' }}>
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            {subtitle}
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-elevated"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-start gap-2.5 text-sm p-3.5 rounded-xl"
                style={{ backgroundColor: 'rgba(224,82,82,0.08)', color: 'var(--ch-accent)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                Email
              </label>
              <Input
                type="email"
                placeholder={`Enter your ${ROLE_LABELS[role].toLowerCase()} email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border"
                style={{
                  backgroundColor: 'var(--ch-input)',
                  borderColor: 'var(--ch-border)',
                  color: 'var(--ch-text)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-xl border pr-10"
                  style={{
                    backgroundColor: 'var(--ch-input)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--ch-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--ch-accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 text-xs pt-1 hover:underline"
              style={{ color: 'var(--ch-muted)' }}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to student login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

