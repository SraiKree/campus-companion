'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LeaveRequest {
  id: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function StudentLeaveRequestPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, router, user]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'student') {
      fetchLeaveRequests();
    }
  }, [loading, isAuthenticated, user]);

  const fetchLeaveRequests = async () => {
    setLoadingRequests(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/student/leave-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load leave requests');
      }

      setLeaveRequests(Array.isArray(data?.leaveRequests) ? data.leaveRequests : []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({ title: 'Load failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !fromDate || !toDate) {
      toast({ title: 'Missing fields', description: 'Reason, from date and to date are required.', variant: 'destructive' });
      return;
    }

    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      toast({ title: 'Invalid dates', description: 'From date cannot be after to date.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/student/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: reason.trim(),
          fromDate,
          toDate,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit leave request');
      }

      toast({ title: 'Leave submitted', description: 'Your leave request has been sent for review.' });
      setReason('');
      setFromDate('');
      setToDate('');
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({ title: 'Submit failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading leave requests...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/student">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/student/attendance">
              <Button variant="ghost">Attendance</Button>
            </Link>
            <Link href="/student/assignments">
              <Button variant="ghost">Assignments</Button>
            </Link>
            <Link href="/student/grades">
              <Button variant="ghost">Grades</Button>
            </Link>
            <Button className="bg-black text-white">Leave Request</Button>
          </div>
        }
      />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle className="text-xl">Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  placeholder="Explain why you need leave"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">From date</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">To date</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle className="text-xl">Request Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaveRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leave requests yet.</p>
              ) : (
                leaveRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium line-clamp-1">{request.reason}</p>
                      <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.from_date).toLocaleDateString()} to {new Date(request.to_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
