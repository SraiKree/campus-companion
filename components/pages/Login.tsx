'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserRole } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, BookOpen, AlertCircle, User, Sun, Moon, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithRollNumber, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignup) {
      const result = await signup(email, password, name, role);
      setLoading(false);
      if (result.success) {
        setError('');
        setIsSignup(false);
        alert('Account created! Please check your email to confirm, then log in.');
      } else {
        setError(result.error || 'Signup failed');
      }
    } else {
      let success = false;

      if (role === 'student') {
        const result = await loginWithRollNumber(rollNumber, password);
        success = result.success;
        if (!success) {
          setError(result.error || 'Invalid roll number or password');
        }
      } else {
        success = await login(email, password);
        if (!success) {
          setError('Invalid email or password. Please check your credentials and try again.');
        }
      }

      setLoading(false);
    }
  };

  return (
    <div
      className={`ch-themed min-h-screen flex flex-col items-center justify-center p-4 relative${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      {/* Theme toggle */}
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
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--ch-accent)' }}
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--ch-text)' }}>
            CampusHub
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
            College ERP System
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 shadow-elevated"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          {/* Role Toggle */}
          <div
            className="flex gap-1.5 p-1.5 rounded-xl mb-6"
            style={{ backgroundColor: 'var(--ch-muted-bg)' }}
          >
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: role === 'student' ? 'var(--ch-card)' : 'transparent',
                color: role === 'student' ? 'var(--ch-accent)' : 'var(--ch-muted)',
                boxShadow: role === 'student' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <User className="h-4 w-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('faculty'); setError(''); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: role === 'faculty' ? 'var(--ch-card)' : 'transparent',
                color: role === 'faculty' ? 'var(--ch-accent)' : 'var(--ch-muted)',
                boxShadow: role === 'faculty' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <BookOpen className="h-4 w-4" /> Faculty
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2.5 text-sm p-3.5 rounded-xl"
                style={{ backgroundColor: 'rgba(224,82,82,0.08)', color: 'var(--ch-accent)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Signup: Name */}
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--ch-input)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                />
              </div>
            )}

            {/* Roll Number / Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                {role === 'student' ? 'Roll Number' : 'Email'}
              </label>
              {role === 'student' ? (
                <Input
                  type="text"
                  placeholder="e.g., 23R21A1285"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    setPassword(e.target.value);
                  }}
                  required
                  className="h-11 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--ch-input)',
                    borderColor: 'var(--ch-border)',
                    color: 'var(--ch-text)',
                  }}
                />
              ) : (
                <Input
                  type="email"
                  placeholder="Enter your email"
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
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={role === 'student' ? 'Your roll number is your password' : 'Enter your password'}
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
              {role === 'student' && !isSignup && (
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  Use your roll number as both username and password
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--ch-accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {loading
                ? (isSignup ? 'Creating Account...' : 'Signing in...')
                : (isSignup ? 'Create Account' : 'Sign In')}
            </Button>

            {/* Toggle Sign In / Sign Up */}
            <p className="text-xs text-center pt-1" style={{ color: 'var(--ch-muted)' }}>
              <button
                type="button"
                className="font-medium hover:underline"
                style={{ color: 'var(--ch-accent)' }}
                onClick={() => { setIsSignup(!isSignup); setError(''); }}
              >
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
