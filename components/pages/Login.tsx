'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GraduationCap, BookOpen, AlertCircle, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { login, loginWithRollNumber, signup } = useAuth();
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
        // Use roll number login for students
        const result = await loginWithRollNumber(rollNumber, password);
        success = result.success;
        if (!success) {
          setError(result.error || 'Invalid roll number or password');
        }
      } else {
        // Use email login for faculty
        success = await login(email, password);
        if (!success) {
          setError('Invalid email or password. Please check your credentials and try again.');
        }
      }
      
      setLoading(false);
      // Navigation will be handled by the page component
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CampusHub</h1>
          <p className="text-muted-foreground mt-1">College ERP System</p>
        </div>

        <Card className="shadow-elevated border-border rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={role === 'student' ? 'default' : 'ghost'}
                className={`flex-1 rounded-full gap-2 ${role === 'student' ? 'bg-[#141414] text-white hover:bg-[#141414]/90' : 'hover:bg-secondary'}`}
                onClick={() => { setRole('student'); setError(''); }}
              >
                <User className="h-4 w-4" /> Student
              </Button>
              <Button
                type="button"
                variant={role === 'faculty' ? 'default' : 'ghost'}
                className={`flex-1 rounded-full gap-2 ${role === 'faculty' ? 'bg-[#141414] text-white hover:bg-[#141414]/90' : 'hover:bg-secondary'}`}
                onClick={() => { setRole('faculty'); setError(''); }}
              >
                <BookOpen className="h-4 w-4" /> Faculty
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor={role === 'student' ? 'rollNumber' : 'email'}>
                  {role === 'student' ? 'Roll Number' : 'Email'}
                </Label>
                {role === 'student' ? (
                  <Input
                    id="rollNumber"
                    type="text"
                    placeholder="Enter your roll number (e.g., 23R21A1285)"
                    value={rollNumber}
                    onChange={(e) => {
                      setRollNumber(e.target.value);
                      // Auto-fill password with roll number for students
                      setPassword(e.target.value);
                    }}
                    required
                    className="rounded-lg"
                  />
                ) : (
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={role === 'student' ? 'Enter your roll number as password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-lg"
                />
                {role === 'student' && !isSignup && (
                  <p className="text-xs text-muted-foreground">
                    Use your roll number as both username and password
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full bg-[#141414] text-white hover:bg-[#141414]/90 rounded-lg" disabled={loading}>
                {loading ? (isSignup ? 'Creating Account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                <button type="button" className="text-[#141414] hover:underline font-medium" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
                  {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
