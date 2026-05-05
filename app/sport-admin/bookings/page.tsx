'use client';

import { useEffect, useState } from 'react';
import { Trophy, CheckCircle2, XCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import SportAdminLayout from '@/components/layout/SportAdminLayout';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BOOKING_STATUSES, type CourtBooking, type BookingStatus } from '@/lib/sports';

type StatusFilter = 'All' | BookingStatus;

const STATUS_COLOR: Record<BookingStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function SportAdminBookingsPage() {
  const { loading, authorized } = useRoleProtection('sport_admin');
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const params = new URLSearchParams({ bookings: 'true' });
      if (filter !== 'All') params.set('status', filter);

      const res = await fetch(`/api/faculty/sports/courts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load bookings');
      setBookings(json.bookings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authorized) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, filter]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/faculty/sports/courts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update');
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SportAdminLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--ch-nav-active)' }}
          >
            <Trophy className="w-5 h-5" style={{ color: 'var(--ch-accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              Bookings
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--ch-muted)' }}>
              Review and approve court booking requests submitted by students.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['All', ...BOOKING_STATUSES] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(s)}
              className="rounded-full"
            >
              {s}
            </Button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl p-4 border border-rose-200 bg-rose-50 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loadingData ? (
          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div
            className="rounded-xl p-6 border text-sm"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
          >
            No bookings found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl p-5 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                        {b.court_name || 'Court'}
                      </span>
                      {b.sport_name && (
                        <Badge variant="outline">{b.sport_name}</Badge>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[b.status]}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm" style={{ color: 'var(--ch-muted)' }}>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>
                          {b.student_name || '—'}
                          {b.student_roll_number && ` · ${b.student_roll_number}`}
                          {b.student_department && ` · ${b.student_department}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{b.booking_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}</span>
                      </div>
                      {b.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{b.location}</span>
                        </div>
                      )}
                    </div>
                    {b.purpose && (
                      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                        Purpose: {b.purpose}
                      </p>
                    )}
                  </div>

                  {b.status === 'Pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={updatingId === b.id}
                        onClick={() => updateStatus(b.id, 'Confirmed')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === b.id}
                        onClick={() => updateStatus(b.id, 'Cancelled')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SportAdminLayout>
  );
}
