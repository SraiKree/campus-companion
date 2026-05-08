'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff, GraduationCap, Moon, Sun } from 'lucide-react';
import AccentPicker from '@/components/AccentPicker';

const Login = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithRollNumber } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithRollNumber(rollNumber, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid roll number or password');
    }
  };

  return (
    <div
      className={`ch-themed min-h-screen flex flex-col items-center justify-center p-4 relative${isDark ? ' dark' : ''}`}
      style={{ backgroundColor: 'var(--ch-bg)' }}
    >
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="no-transition w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
            color: 'var(--ch-accent)',
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <AccentPicker />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in">
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
            Student Login
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
                style={{ backgroundColor: 'var(--ch-accent-soft)', color: 'var(--ch-accent)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                Roll Number
              </label>
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
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ch-text)' }}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your roll number is your password"
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
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                Use your roll number as both username and password
              </p>
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
