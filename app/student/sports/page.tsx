'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, Calendar, Users, Medal, Search, MapPin, Clock,
  UserCheck, AlertCircle, CheckCircle2, XCircle, Download, Star,
  Award, Zap, Target, CircleDot, Dribbble, Brain, Activity, Flame,
  ChevronRight, Building2, CalendarPlus,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  SPORT_CATEGORIES, type Sport, type SportCategory, type SportCourt, type CourtBooking,
} from '@/lib/sports';

import StudentLayout from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const ICON_MAP: Record<string, any> = {
  Trophy, Target, CircleDot, Dribbble, Brain, Activity, Zap,
  TableProperties: Activity, Medal, Star, Award, Flame,
};

const CATEGORY_COLORS: Record<SportCategory, { bg: string; text: string; border: string; accent: string }> = {
  Cricket: { bg: 'rgba(22,163,74,0.1)', text: '#16a34a', border: 'rgba(22,163,74,0.3)', accent: '#16a34a' },
  Football: { bg: 'rgba(37,99,235,0.1)', text: '#2563eb', border: 'rgba(37,99,235,0.3)', accent: '#2563eb' },
  Basketball: { bg: 'rgba(234,88,12,0.1)', text: '#ea580c', border: 'rgba(234,88,12,0.3)', accent: '#ea580c' },
  Badminton: { bg: 'rgba(147,51,234,0.1)', text: '#9333ea', border: 'rgba(147,51,234,0.3)', accent: '#9333ea' },
  Athletics: { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', border: 'rgba(220,38,38,0.3)', accent: '#dc2626' },
  'Indoor Games': { bg: 'rgba(13,148,136,0.1)', text: '#0d9488', border: 'rgba(13,148,136,0.3)', accent: '#0d9488' },
};

interface SportEventWithMeta {
  id: string;
  sport_id: string;
  sport_name?: string;
  sport_category?: SportCategory;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  eligibility: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  status: string;
  winner: string | null;
  runner_up: string | null;
  third_place: string | null;
  results_notes: string | null;
  registration_count: number;
  my_registration: { id: string; status: string } | null;
}

interface MyRegistration {
  id: string;
  event_id: string;
  status: string;
  notes: string | null;
  registered_at: string;
  event: {
    id: string;
    name: string;
    event_date: string;
    event_time: string | null;
    venue: string | null;
    status: string;
    sport_name?: string;
    sport_category?: string;
  } | null;
}

interface MyAchievement {
  id: string;
  title: string;
  position: string | null;
  description: string | null;
  certificate_url: string | null;
  awarded_at: string;
  sport_name?: string;
  event_name?: string;
  event_date?: string;
}

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  roll_no: string;
  department: string;
  points: number;
  wins: number;
  achievements: number;
}

export default function StudentSportsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('sports');
  const [sports, setSports] = useState<Sport[]>([]);
  const [events, setEvents] = useState<SportEventWithMeta[]>([]);
  const [myRegs, setMyRegs] = useState<MyRegistration[]>([]);
  const [myAchievements, setMyAchievements] = useState<MyAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courts, setCourts] = useState<SportCourt[]>([]);
  const [myBookings, setMyBookings] = useState<CourtBooking[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<SportCategory | ''>('');

  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [registerDialog, setRegisterDialog] = useState<SportEventWithMeta | null>(null);
  const [registerNotes, setRegisterNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bookingCourt, setBookingCourt] = useState<SportCourt | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [sportsRes, eventsRes, meRes, lbRes, courtsRes, bookingsRes] = await Promise.all([
        fetch('/api/student/sports', { headers }),
        fetch('/api/student/sports/events?status=Upcoming', { headers }),
        fetch('/api/student/sports/me', { headers }),
        fetch('/api/student/sports/leaderboard', { headers }),
        fetch('/api/student/sports/courts', { headers }),
        fetch('/api/student/sports/courts?mine=true', { headers }),
      ]);

      const [sportsJson, eventsJson, meJson, lbJson, courtsJson, bookingsJson] = await Promise.all([
        sportsRes.json(), eventsRes.json(), meRes.json(), lbRes.json(),
        courtsRes.json(), bookingsRes.json(),
      ]);

      setSports(sportsJson.sports || []);
      setEvents(eventsJson.events || []);
      setMyRegs(meJson.registrations || []);
      setMyAchievements(meJson.achievements || []);
      setLeaderboard(lbJson.leaderboard || []);
      setCourts(courtsJson.courts || []);
      setMyBookings(bookingsJson.bookings || []);
    } catch (err) {
      console.error('Sports fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'student') {
      fetchAll();
    }
  }, [loading, isAuthenticated, user]);

  const filteredSports = useMemo(() => {
    return sports.filter((s) => {
      if (filterCategory && s.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.coach || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sports, searchQuery, filterCategory]);

  const sportsByCategory = useMemo(() => {
    const grouped: Record<string, Sport[]> = {};
    filteredSports.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [filteredSports]);

  const sportEvents = useMemo(() => {
    if (!selectedSport) return [];
    return events.filter((e) => e.sport_id === selectedSport.id);
  }, [events, selectedSport]);

  const handleRegister = async () => {
    if (!registerDialog) return;
    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/sports/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: registerDialog.id, notes: registerNotes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to register');
        return;
      }
      setRegisterDialog(null);
      setRegisterNotes('');
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this court booking?')) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/student/sports/courts?id=${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to cancel');
        return;
      }
      await fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Cancel this registration?')) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/student/sports/events?registration_id=${registrationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to cancel');
        return;
      }
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
        </div>
      </StudentLayout>
    );
  }
  if (!isAuthenticated || user?.role !== 'student') return null;

  const upcomingEvents = events.slice(0, 3);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div
          className="rounded-3xl p-8 relative overflow-hidden border"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#e05252' }}
                >
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
                    Sports & Activities
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                    Explore, register, and track your sporting journey
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <StatChip label="Sports" value={sports.length} icon={Trophy} color="#e05252" />
              <StatChip label="My Events" value={myRegs.length} icon={Calendar} color="#e05252" />
              <StatChip label="Awards" value={myAchievements.length} icon={Medal} color="#d97706" />
            </div>
          </div>
        </div>

        {/* Upcoming highlights */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>
                Upcoming Events
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingEvents.map((e) => {
                const colors = CATEGORY_COLORS[e.sport_category as SportCategory] || CATEGORY_COLORS['Indoor Games'];
                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border p-5 hover:shadow-md cursor-pointer transition-shadow"
                    style={{
                      backgroundColor: 'var(--ch-card)',
                      borderColor: 'var(--ch-border)',
                      borderLeft: `4px solid ${colors.accent}`,
                    }}
                    onClick={() => { setTab('events'); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        className="border text-xs"
                        style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                      >
                        {e.sport_name}
                      </Badge>
                      {e.my_registration && (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">
                          {e.my_registration.status}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--ch-text)' }}>{e.name}</h3>
                    <div className="text-sm space-y-1" style={{ color: 'var(--ch-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {e.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {e.venue}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList
            className="h-11 p-1 rounded-xl border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <TabsTrigger value="sports" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Trophy className="w-4 h-4" /> Sports
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Calendar className="w-4 h-4" /> Events
            </TabsTrigger>
            <TabsTrigger value="courts" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Building2 className="w-4 h-4" /> Book Courts
            </TabsTrigger>
            <TabsTrigger value="me" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <UserCheck className="w-4 h-4" /> My Activity
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Medal className="w-4 h-4" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Sports Tab */}
          <TabsContent value="sports" className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sports, coaches..."
                  className="pl-10 border"
                  style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as SportCategory | '')}
                className="h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">All Categories</option>
                {SPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {loadingData ? (
              <LoadingBlock />
            ) : filteredSports.length === 0 ? (
              <EmptyBlock icon={Trophy} title="No sports found" message="Try changing your search or category filter" />
            ) : (
              <div className="space-y-6">
                {Object.entries(sportsByCategory).map(([category, list]) => {
                  const colors = CATEGORY_COLORS[category as SportCategory] || CATEGORY_COLORS['Indoor Games'];
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: colors.accent }} />
                        <h3 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>{category}</h3>
                        <span className="text-sm" style={{ color: 'var(--ch-muted)' }}>({list.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {list.map((sport) => {
                          const Icon = ICON_MAP[sport.icon || 'Trophy'] || Trophy;
                          const eventsForSport = events.filter((e) => e.sport_id === sport.id).length;
                          return (
                            <div
                              key={sport.id}
                              className="rounded-2xl border overflow-hidden hover:shadow-lg transition-all group"
                              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                            >
                              <div
                                className="h-20 flex items-center justify-center relative"
                                style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})` }}
                              >
                                <Icon className="w-10 h-10 text-white opacity-90" />
                              </div>
                              <div className="p-5 space-y-3">
                                <div>
                                  <h4 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{sport.name}</h4>
                                  {sport.coach && (
                                    <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                                      Coach: {sport.coach}
                                    </p>
                                  )}
                                </div>
                                {sport.schedule && (
                                  <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                                    <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{sport.schedule}</span>
                                  </div>
                                )}
                                {sport.venue && (
                                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{sport.venue}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                                  <span className="text-xs font-medium" style={{ color: colors.accent }}>
                                    {eventsForSport} upcoming {eventsForSport === 1 ? 'event' : 'events'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedSport(sport)}
                                    className="gap-1 h-8 text-xs"
                                    style={{ color: colors.accent }}
                                  >
                                    View Details <ChevronRight className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6 space-y-4">
            {loadingData ? (
              <LoadingBlock />
            ) : events.length === 0 ? (
              <EmptyBlock icon={Calendar} title="No upcoming events" message="Check back later for new tournaments" />
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onRegister={() => { setRegisterDialog(ev); setRegisterNotes(''); }}
                    onCancel={() => ev.my_registration && handleCancelRegistration(ev.my_registration.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Courts Tab */}
          <TabsContent value="courts" className="mt-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#e05252]" />
                <h3 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>Available Courts</h3>
              </div>
              {loadingData ? <LoadingBlock /> : courts.length === 0 ? (
                <EmptyBlock icon={Building2} title="No courts available" message="Check back later for bookable courts" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courts.map((c) => {
                    const colors = CATEGORY_COLORS[c.sport_category as SportCategory] || CATEGORY_COLORS['Indoor Games'];
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border p-5 space-y-3 hover:shadow-md transition-shadow"
                        style={{
                          backgroundColor: 'var(--ch-card)',
                          borderColor: 'var(--ch-border)',
                          borderLeft: `4px solid ${colors.accent}`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{c.name}</h4>
                            {c.sport_name && (
                              <Badge
                                className="border text-xs mt-1"
                                style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                              >
                                {c.sport_name}
                              </Badge>
                            )}
                          </div>
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})` }}
                          >
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        {c.description && (
                          <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{c.description}</p>
                        )}
                        <div className="text-xs space-y-1" style={{ color: 'var(--ch-muted)' }}>
                          {c.location && (
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.location}</div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Open {c.opens_at.slice(0, 5)} – {c.closes_at.slice(0, 5)}
                          </div>
                          {c.capacity && (
                            <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Capacity {c.capacity}</div>
                          )}
                        </div>
                        <Button
                          onClick={() => setBookingCourt(c)}
                          className="w-full gap-2 text-white"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <CalendarPlus className="w-4 h-4" /> Book a Slot
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#e05252]" />
                <h3 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>My Bookings</h3>
              </div>
              {myBookings.length === 0 ? (
                <EmptyBlock icon={Calendar} title="No bookings yet" message="Book a court above to reserve your slot" />
              ) : (
                <div className="space-y-2">
                  {myBookings.map((b) => {
                    const upcoming = new Date(`${b.booking_date}T${b.start_time}`) >= new Date();
                    const statusInfo = {
                      Confirmed: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
                      Pending: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
                      Cancelled: { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
                      Completed: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
                    }[b.status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                    return (
                      <div
                        key={b.id}
                        className="rounded-xl border p-4 flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold" style={{ color: 'var(--ch-text)' }}>{b.court_name}</h4>
                            {b.sport_name && <Badge variant="outline" className="text-[10px]">{b.sport_name}</Badge>}
                          </div>
                          <div className="text-xs mt-1 flex flex-wrap gap-3" style={{ color: 'var(--ch-muted)' }}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                            </span>
                            {b.location && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.location}</span>
                            )}
                          </div>
                          {b.purpose && (
                            <p className="text-xs mt-1 italic" style={{ color: 'var(--ch-muted)' }}>"{b.purpose}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className="border"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.color + '40' }}
                          >
                            {b.status}
                          </Badge>
                          {upcoming && (b.status === 'Confirmed' || b.status === 'Pending') && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-red-600 h-8"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>

          {/* My Activity Tab */}
          <TabsContent value="me" className="mt-6 space-y-6">
            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
                <Calendar className="w-5 h-5 text-[#e05252]" />
                Participation History
              </h3>
              {myRegs.length === 0 ? (
                <EmptyBlock icon={Calendar} title="No registrations yet" message="Register for an event to get started" />
              ) : (
                <div className="space-y-2">
                  {myRegs.map((r) => {
                    const statusInfo = {
                      Pending: { color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: Clock },
                      Approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 },
                      Rejected: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: XCircle },
                    }[r.status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: AlertCircle };
                    const SIcon = statusInfo.icon;
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border p-4 flex items-center justify-between gap-3"
                        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate" style={{ color: 'var(--ch-text)' }}>
                              {r.event?.name || 'Event'}
                            </h4>
                            {r.event?.sport_name && (
                              <Badge className="text-[10px]" variant="outline">{r.event.sport_name}</Badge>
                            )}
                          </div>
                          <div className="text-xs flex flex-wrap items-center gap-3" style={{ color: 'var(--ch-muted)' }}>
                            {r.event?.event_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(r.event.event_date).toLocaleDateString()}
                              </span>
                            )}
                            {r.event?.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {r.event.venue}
                              </span>
                            )}
                            <span>Registered {new Date(r.registered_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className="border gap-1"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.color + '40' }}
                          >
                            <SIcon className="w-3 h-3" />
                            {r.status}
                          </Badge>
                          {r.status === 'Pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelRegistration(r.id)}
                              className="text-red-600 h-8"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
                <Medal className="w-5 h-5 text-amber-600" />
                Achievements & Certificates
              </h3>
              {myAchievements.length === 0 ? (
                <EmptyBlock icon={Medal} title="No achievements yet" message="Your awards will appear here once granted" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myAchievements.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border p-5 relative overflow-hidden"
                      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                    >
                      <div
                        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#dc2626)' }}
                      />
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Medal className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold" style={{ color: 'var(--ch-text)' }}>{a.title}</h4>
                          {a.position && (
                            <Badge className="mt-1 bg-amber-100 text-amber-700 border-amber-200">
                              {a.position}
                            </Badge>
                          )}
                          <div className="text-xs mt-2 space-y-0.5" style={{ color: 'var(--ch-muted)' }}>
                            {a.sport_name && <p>Sport: {a.sport_name}</p>}
                            {a.event_name && <p>Event: {a.event_name}</p>}
                            <p>Awarded: {new Date(a.awarded_at).toLocaleDateString()}</p>
                          </div>
                          {a.description && (
                            <p className="text-sm mt-2" style={{ color: 'var(--ch-muted)' }}>{a.description}</p>
                          )}
                          {a.certificate_url && (
                            <a
                              href={a.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-amber-600 hover:text-amber-700"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Certificate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-6">
            {loadingData ? (
              <LoadingBlock />
            ) : leaderboard.length === 0 ? (
              <EmptyBlock icon={Medal} title="Leaderboard is empty" message="Be the first to earn an achievement!" />
            ) : (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div
                  className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide border-b"
                  style={{ color: 'var(--ch-muted)', borderColor: 'var(--ch-border)' }}
                >
                  <span className="col-span-1">Rank</span>
                  <span className="col-span-5">Student</span>
                  <span className="col-span-2 text-center">Dept</span>
                  <span className="col-span-1 text-center">Wins</span>
                  <span className="col-span-1 text-center">Awards</span>
                  <span className="col-span-2 text-right">Points</span>
                </div>
                {leaderboard.map((entry) => {
                  const isMe = entry.student_id === user?.id;
                  const rankBg = entry.rank === 1 ? '#fef3c7' : entry.rank === 2 ? '#f3f4f6' : entry.rank === 3 ? '#fed7aa' : 'transparent';
                  return (
                    <div
                      key={entry.student_id}
                      className="grid grid-cols-12 px-5 py-4 items-center border-b last:border-b-0 transition-colors"
                      style={{
                        borderColor: 'var(--ch-border)',
                        backgroundColor: isMe ? 'rgba(224,82,82,0.08)' : 'transparent',
                      }}
                    >
                      <div className="col-span-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: rankBg, color: entry.rank <= 3 ? '#92400e' : 'var(--ch-muted)' }}
                        >
                          {entry.rank}
                        </div>
                      </div>
                      <div className="col-span-5">
                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
                          {entry.student_name}
                          {isMe && (
                            <Badge
                              className="text-[10px] border"
                              style={{
                                backgroundColor: 'rgba(224,82,82,0.1)',
                                color: '#e05252',
                                borderColor: 'rgba(224,82,82,0.3)',
                              }}
                            >
                              You
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{entry.roll_no}</p>
                      </div>
                      <div className="col-span-2 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
                        {entry.department || '—'}
                      </div>
                      <div className="col-span-1 text-center text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                        {entry.wins}
                      </div>
                      <div className="col-span-1 text-center text-sm" style={{ color: 'var(--ch-muted)' }}>
                        {entry.achievements}
                      </div>
                      <div className="col-span-2 text-right text-lg font-bold" style={{ color: '#e05252' }}>
                        {entry.points}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sport details dialog */}
      <Dialog open={!!selectedSport} onOpenChange={(o) => !o && setSelectedSport(null)}>
        <DialogContent className="max-w-2xl">
          {selectedSport && (() => {
            const colors = CATEGORY_COLORS[selectedSport.category];
            const Icon = ICON_MAP[selectedSport.icon || 'Trophy'] || Trophy;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})` }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">{selectedSport.name}</DialogTitle>
                      <DialogDescription>{selectedSport.category}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedSport.description && (
                    <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{selectedSport.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSport.coach && (
                      <InfoRow icon={Users} label="Coach" value={selectedSport.coach} />
                    )}
                    {selectedSport.schedule && (
                      <InfoRow icon={Clock} label="Schedule" value={selectedSport.schedule} />
                    )}
                    {selectedSport.venue && (
                      <InfoRow icon={MapPin} label="Venue" value={selectedSport.venue} />
                    )}
                    {selectedSport.coach_email && (
                      <InfoRow icon={UserCheck} label="Contact" value={selectedSport.coach_email} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--ch-text)' }}>Upcoming Events</h4>
                    {sportEvents.length === 0 ? (
                      <p className="text-sm italic" style={{ color: 'var(--ch-muted)' }}>No upcoming events for this sport</p>
                    ) : (
                      <div className="space-y-2">
                        {sportEvents.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            style={{ borderColor: 'var(--ch-border)' }}
                          >
                            <div>
                              <p className="font-medium text-sm" style={{ color: 'var(--ch-text)' }}>{e.name}</p>
                              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                                {new Date(e.event_date).toLocaleDateString()} {e.venue && `• ${e.venue}`}
                              </p>
                            </div>
                            {e.my_registration ? (
                              <Badge className="bg-green-100 text-green-700">{e.my_registration.status}</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => { setSelectedSport(null); setRegisterDialog(e); }}
                                style={{ backgroundColor: colors.accent }}
                                className="text-white"
                              >
                                Register
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Court booking dialog */}
      <CourtBookingDialog
        court={bookingCourt}
        onClose={() => setBookingCourt(null)}
        onBooked={() => { setBookingCourt(null); fetchAll(); }}
      />

      {/* Register dialog */}
      <Dialog open={!!registerDialog} onOpenChange={(o) => !o && setRegisterDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {registerDialog?.name}</DialogTitle>
            <DialogDescription>
              {registerDialog?.sport_name} · {registerDialog && new Date(registerDialog.event_date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {registerDialog?.eligibility && (
              <div className="p-3 rounded-lg border text-sm" style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--ch-muted)' }}>ELIGIBILITY</p>
                <p style={{ color: 'var(--ch-text)' }}>{registerDialog.eligibility}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>
                Notes (optional)
              </label>
              <Textarea
                value={registerNotes}
                onChange={(e) => setRegisterNotes(e.target.value)}
                placeholder="Any additional info for the coach..."
                rows={3}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
              Your registration will be reviewed by the coach/faculty before approval.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegisterDialog(null)}>Cancel</Button>
            <Button
              onClick={handleRegister}
              disabled={submitting}
              className="bg-[#e05252] hover:bg-[#c94545] text-white"
            >
              {submitting ? 'Submitting...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}

function StatChip({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
          {label}
        </p>
        <p className="text-xl font-bold" style={{ color: 'var(--ch-text)' }}>{value}</p>
      </div>
    </div>
  );
}

function EventCard({
  event, onRegister, onCancel,
}: {
  event: SportEventWithMeta;
  onRegister: () => void;
  onCancel: () => void;
}) {
  const colors = CATEGORY_COLORS[event.sport_category as SportCategory] || CATEGORY_COLORS['Indoor Games'];
  const deadlinePassed = event.registration_deadline && new Date(event.registration_deadline) < new Date();
  const full = event.max_participants && event.registration_count >= event.max_participants;
  const reg = event.my_registration;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--ch-card)',
        borderColor: 'var(--ch-border)',
        borderLeft: `4px solid ${colors.accent}`,
      }}
    >
      <div className="p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[240px] space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className="border"
              style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              {event.sport_name}
            </Badge>
            <Badge
              className="border text-[10px]"
              variant="outline"
              style={{ borderColor: colors.border }}
            >
              {event.status}
            </Badge>
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>{event.name}</h3>
          {event.description && (
            <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{event.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {event.event_time && ` at ${event.event_time.slice(0, 5)}`}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.venue}</span>
            )}
            {event.registration_deadline && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Deadline: {new Date(event.registration_deadline).toLocaleDateString()}
              </span>
            )}
            {event.max_participants && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {event.registration_count}/{event.max_participants} registered
              </span>
            )}
          </div>
          {event.eligibility && (
            <p className="text-xs italic" style={{ color: 'var(--ch-muted)' }}>
              Eligibility: {event.eligibility}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {reg ? (
            <>
              <Badge
                className="border gap-1"
                style={{
                  backgroundColor: reg.status === 'Approved' ? 'rgba(22,163,74,0.1)' : reg.status === 'Rejected' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                  color: reg.status === 'Approved' ? '#16a34a' : reg.status === 'Rejected' ? '#dc2626' : '#d97706',
                  borderColor: 'transparent',
                }}
              >
                {reg.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
                 reg.status === 'Rejected' ? <XCircle className="w-3 h-3" /> :
                 <Clock className="w-3 h-3" />}
                {reg.status}
              </Badge>
              {reg.status === 'Pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                >
                  Cancel Registration
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onRegister}
              disabled={deadlinePassed || !!full || event.status !== 'Upcoming'}
              style={{ backgroundColor: deadlinePassed || full ? undefined : colors.accent }}
              className="text-white hover:opacity-90"
            >
              {deadlinePassed ? 'Registration Closed' :
               full ? 'Event Full' :
               event.status !== 'Upcoming' ? event.status : 'Register'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252]" />
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <div
      className="rounded-2xl border p-12 text-center"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <Icon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--ch-muted)' }} />
      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ch-text)' }}>{title}</h3>
      <p style={{ color: 'var(--ch-muted)' }}>{message}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--ch-muted)' }} />
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ch-muted)' }}>{label}</p>
      </div>
      <p className="text-sm" style={{ color: 'var(--ch-text)' }}>{value}</p>
    </div>
  );
}

function CourtBookingDialog({
  court, onClose, onBooked,
}: {
  court: SportCourt | null;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState<{ start_time: string; end_time: string; student_name: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!court) return;
    setDate(new Date().toISOString().slice(0, 10));
    setStartTime(court.opens_at.slice(0, 5));
    const end = new Date(`2000-01-01T${court.opens_at}`);
    end.setMinutes(end.getMinutes() + court.slot_minutes);
    setEndTime(end.toTimeString().slice(0, 5));
    setPurpose('');
  }, [court]);

  useEffect(() => {
    if (!court || !date) return;
    (async () => {
      setLoadingSlots(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/student/sports/courts?court_id=${court.id}&date=${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        setBusy(data.slots || []);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [court, date]);

  if (!court) return null;

  const handleBook = async () => {
    if (!startTime || !endTime) { alert('Pick a start and end time'); return; }
    if (endTime <= startTime) { alert('End time must be after start time'); return; }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/sports/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          court_id: court.id,
          booking_date: date,
          start_time: startTime,
          end_time: endTime,
          purpose,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed to book'); return; }
      onBooked();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!court} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book {court.name}</DialogTitle>
          <DialogDescription>
            {court.sport_name && `${court.sport_name} · `}Open {court.opens_at.slice(0, 5)} – {court.closes_at.slice(0, 5)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>Date</label>
            <Input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>Start</label>
              <Input
                type="time"
                value={startTime}
                min={court.opens_at.slice(0, 5)}
                max={court.closes_at.slice(0, 5)}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>End</label>
              <Input
                type="time"
                value={endTime}
                min={court.opens_at.slice(0, 5)}
                max={court.closes_at.slice(0, 5)}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>Purpose (optional)</label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Practice with friends"
            />
          </div>
          <div
            className="rounded-lg border p-3"
            style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ch-muted)' }}>
              Already booked on this date
            </p>
            {loadingSlots ? (
              <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Loading…</p>
            ) : busy.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--ch-muted)' }}>No bookings — court is free all day!</p>
            ) : (
              <ul className="space-y-1 text-xs" style={{ color: 'var(--ch-text)' }}>
                {busy.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                    {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleBook}
            disabled={submitting}
            className="bg-[#e05252] hover:bg-[#c94545] text-white gap-1"
          >
            <CalendarPlus className="w-4 h-4" />
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
