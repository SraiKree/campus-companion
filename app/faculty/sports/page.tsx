'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, Plus, Edit3, Trash2, Calendar, Users, Medal,
  CheckCircle2, XCircle, Clock, MapPin, Target, UserPlus,
  Award, AlertCircle, ShieldCheck, Building2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  SPORT_CATEGORIES, EVENT_STATUSES, ACHIEVEMENT_POSITIONS, BOOKING_STATUSES,
  type Sport, type SportCategory, type SportCourt, type CourtBooking,
} from '@/lib/sports';

import FacultyLayout from '@/components/layout/FacultyLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface AdminEvent {
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
  pending_count: number;
  total_registrations: number;
}

interface AdminRegistration {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string | null;
  student_roll_number: string | null;
  student_department: string | null;
  notes: string | null;
  status: string;
  registered_at: string;
  event_name?: string;
  event_date?: string;
  sport_name?: string;
}

interface AdminTeam {
  id: string;
  sport_id: string;
  sport_name?: string;
  name: string;
  captain_name: string | null;
  description: string | null;
  members: {
    id: string;
    student_id: string;
    student_name: string | null;
    student_roll_number: string | null;
    position: string | null;
  }[];
}

interface AdminAchievement {
  id: string;
  student_id: string;
  student_name: string;
  student_roll_number: string;
  student_department: string;
  title: string;
  position: string | null;
  description: string | null;
  certificate_url: string | null;
  awarded_at: string;
  sport_name?: string;
  event_name?: string;
}

export default function FacultySportsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('sports');
  const [sports, setSports] = useState<Sport[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [courts, setCourts] = useState<SportCourt[]>([]);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Dialog state
  const [sportDialog, setSportDialog] = useState<{ open: boolean; sport: Sport | null }>({ open: false, sport: null });
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: AdminEvent | null }>({ open: false, event: null });
  const [resultsDialog, setResultsDialog] = useState<AdminEvent | null>(null);
  const [teamDialog, setTeamDialog] = useState(false);
  const [memberDialog, setMemberDialog] = useState<AdminTeam | null>(null);
  const [achievementDialog, setAchievementDialog] = useState(false);
  const [courtDialog, setCourtDialog] = useState<{ open: boolean; court: SportCourt | null }>({ open: false, court: null });

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'faculty')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const getToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token || null;
  };

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [sp, ev, re, te, ac, co, bo] = await Promise.all([
        fetch('/api/faculty/sports', { headers }),
        fetch('/api/faculty/sports/events', { headers }),
        fetch('/api/faculty/sports/registrations', { headers }),
        fetch('/api/faculty/sports/teams', { headers }),
        fetch('/api/faculty/sports/achievements', { headers }),
        fetch('/api/faculty/sports/courts', { headers }),
        fetch('/api/faculty/sports/courts?bookings=true', { headers }),
      ]);

      const [sj, ej, rj, tj, aj, cj, bj] = await Promise.all([
        sp.json(), ev.json(), re.json(), te.json(), ac.json(), co.json(), bo.json(),
      ]);

      setSports(sj.sports || []);
      setEvents(ej.events || []);
      setRegistrations(rj.registrations || []);
      setTeams(tj.teams || []);
      setAchievements(aj.achievements || []);
      setCourts(cj.courts || []);
      setBookings(bj.bookings || []);
    } catch (err) {
      console.error('Faculty sports fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      fetchAll();
    }
  }, [loading, isAuthenticated, user]);

  const stats = useMemo(() => ({
    sports: sports.length,
    events: events.length,
    pendingRegs: registrations.filter((r) => r.status === 'Pending').length,
    teams: teams.length,
  }), [sports, events, registrations, teams]);

  const handleDeleteSport = async (id: string) => {
    if (!confirm('Delete this sport? Events and registrations will be deleted too.')) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/faculty/sports?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAll();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Failed');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/faculty/sports/events?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAll();
  };

  const handleRegistrationAction = async (id: string, status: 'Approved' | 'Rejected') => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch('/api/faculty/sports/registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchAll();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/faculty/sports/teams?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAll();
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch('/api/faculty/sports/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_id: teamId, member_id: memberId, action: 'remove' }),
    });
    if (res.ok) fetchAll();
  };

  const handleDeleteCourt = async (id: string) => {
    if (!confirm('Delete this court? Active bookings will be removed.')) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/faculty/sports/courts?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAll();
  };

  const handleBookingStatus = async (bookingId: string, status: 'Confirmed' | 'Cancelled' | 'Completed') => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch('/api/faculty/sports/courts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ booking_id: bookingId, status }),
    });
    if (res.ok) fetchAll();
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/faculty/sports/achievements?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAll();
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252]" />
        </div>
      </FacultyLayout>
    );
  }
  if (!isAuthenticated || user?.role !== 'faculty') return null;

  return (
    <FacultyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--ch-text)' }}>
              <Trophy className="w-8 h-8 text-[#e05252]" />
              Sports Management
            </h1>
            <p className="mt-1" style={{ color: 'var(--ch-muted)' }}>
              Manage sports, events, registrations, teams, and achievements
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Sports" value={stats.sports} icon={Trophy} color="#e05252" />
          <StatCard label="Events" value={stats.events} icon={Calendar} color="#e05252" />
          <StatCard label="Pending Approvals" value={stats.pendingRegs} icon={AlertCircle} color="#d97706" />
          <StatCard label="Teams" value={stats.teams} icon={Users} color="#e05252" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList
            className="h-11 p-1 rounded-xl border flex-wrap"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <TabsTrigger value="sports" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Trophy className="w-4 h-4" /> Sports
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Calendar className="w-4 h-4" /> Events
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <ShieldCheck className="w-4 h-4" /> Registrations
              {stats.pendingRegs > 0 && (
                <Badge className="bg-amber-500 text-white h-5 min-w-5 text-xs">{stats.pendingRegs}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Users className="w-4 h-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="courts" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Building2 className="w-4 h-4" /> Courts
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2 data-[state=active]:bg-[#e05252] data-[state=active]:text-white">
              <Medal className="w-4 h-4" /> Achievements
            </TabsTrigger>
          </TabsList>

          {/* SPORTS TAB */}
          <TabsContent value="sports" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setSportDialog({ open: true, sport: null })}
                className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
              >
                <Plus className="w-4 h-4" /> Add Sport
              </Button>
            </div>
            {loadingData ? <LoadingBlock /> : sports.length === 0 ? (
              <EmptyBlock icon={Trophy} title="No sports yet" message="Add your first sport to get started" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sports.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border p-5 space-y-3"
                    style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{s.name}</h3>
                        <Badge variant="outline" className="mt-1 text-xs">{s.category}</Badge>
                      </div>
                      {!s.is_active && <Badge className="bg-gray-200 text-gray-700 text-[10px]">Inactive</Badge>}
                    </div>
                    <div className="text-sm space-y-1" style={{ color: 'var(--ch-muted)' }}>
                      {s.coach && <p><span className="font-medium">Coach:</span> {s.coach}</p>}
                      {s.schedule && <p className="flex items-start gap-1"><Clock className="w-3.5 h-3.5 mt-0.5" /> {s.schedule}</p>}
                      {s.venue && <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {s.venue}</p>}
                    </div>
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                      <Button
                        size="sm" variant="outline" className="flex-1 gap-1"
                        onClick={() => setSportDialog({ open: true, sport: s })}
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDeleteSport(s.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setEventDialog({ open: true, event: null })}
                className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
                disabled={sports.length === 0}
              >
                <Plus className="w-4 h-4" /> Add Event
              </Button>
            </div>
            {loadingData ? <LoadingBlock /> : events.length === 0 ? (
              <EmptyBlock icon={Calendar} title="No events yet" message="Create an event to open tournaments" />
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border p-5"
                    style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-[260px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline">{e.sport_name}</Badge>
                          <Badge
                            className={
                              e.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                              e.status === 'Ongoing' ? 'bg-green-100 text-green-700' :
                              e.status === 'Completed' ? 'bg-gray-200 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }
                          >
                            {e.status}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{e.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--ch-muted)' }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(e.event_date).toLocaleDateString()}</span>
                          {e.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.venue}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.registration_count} approved / {e.total_registrations} total</span>
                          {e.pending_count > 0 && (
                            <span className="font-medium text-amber-600">{e.pending_count} pending</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setResultsDialog(e)} className="gap-1">
                          <Target className="w-3 h-3" /> Results
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEventDialog({ open: true, event: e })}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleDeleteEvent(e.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REGISTRATIONS TAB */}
          <TabsContent value="registrations" className="mt-6 space-y-4">
            {loadingData ? <LoadingBlock /> : registrations.length === 0 ? (
              <EmptyBlock icon={ShieldCheck} title="No registrations yet" message="Student registrations will appear here" />
            ) : (
              <div className="space-y-2">
                {registrations.map((r) => {
                  const statusInfo = {
                    Pending: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
                    Approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
                    Rejected: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
                  }[r.status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border p-4 flex flex-wrap items-center gap-3"
                      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                    >
                      <div className="flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                            {r.student_name || 'Student'}
                          </h4>
                          {r.student_roll_number && (
                            <Badge variant="outline" className="text-[10px]">{r.student_roll_number}</Badge>
                          )}
                          {r.student_department && (
                            <Badge variant="outline" className="text-[10px]">{r.student_department}</Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
                          {r.sport_name} — <strong>{r.event_name}</strong>
                          {r.event_date && ` · ${new Date(r.event_date).toLocaleDateString()}`}
                        </p>
                        {r.notes && (
                          <p className="text-xs italic mt-1" style={{ color: 'var(--ch-muted)' }}>"{r.notes}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className="border"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.color + '40' }}
                        >
                          {r.status}
                        </Badge>
                        {r.status === 'Pending' && (
                          <>
                            <Button
                              size="sm" onClick={() => handleRegistrationAction(r.id, 'Approved')}
                              className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleRegistrationAction(r.id, 'Rejected')}
                              className="border-red-200 text-red-600 hover:bg-red-50 gap-1 h-8"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TEAMS TAB */}
          <TabsContent value="teams" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setTeamDialog(true)}
                className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
                disabled={sports.length === 0}
              >
                <Plus className="w-4 h-4" /> Create Team
              </Button>
            </div>
            {loadingData ? <LoadingBlock /> : teams.length === 0 ? (
              <EmptyBlock icon={Users} title="No teams yet" message="Create teams to organize players" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border p-5 space-y-3"
                    style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{t.name}</h3>
                        <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                          {t.sport_name} {t.captain_name && `· Captain: ${t.captain_name}`}
                        </p>
                      </div>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDeleteTeam(t.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {t.description && (
                      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>{t.description}</p>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ch-muted)' }}>
                        Members ({t.members?.length || 0})
                      </p>
                      {t.members && t.members.length > 0 ? (
                        <div className="space-y-1.5">
                          {t.members.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                              style={{ borderColor: 'var(--ch-border)' }}
                            >
                              <div className="flex-1">
                                <p className="font-medium" style={{ color: 'var(--ch-text)' }}>
                                  {m.student_name} <span className="text-xs font-normal" style={{ color: 'var(--ch-muted)' }}>({m.student_roll_number})</span>
                                </p>
                                {m.position && (
                                  <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>{m.position}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveMember(t.id, m.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: 'var(--ch-muted)' }}>No members yet</p>
                      )}
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="w-full gap-1"
                      onClick={() => setMemberDialog(t)}
                    >
                      <UserPlus className="w-3 h-3" /> Add Member
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COURTS TAB */}
          <TabsContent value="courts" className="mt-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
                  <Building2 className="w-5 h-5 text-[#e05252]" />
                  Courts
                </h3>
                <Button
                  onClick={() => setCourtDialog({ open: true, court: null })}
                  className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
                >
                  <Plus className="w-4 h-4" /> Add Court
                </Button>
              </div>
              {loadingData ? <LoadingBlock /> : courts.length === 0 ? (
                <EmptyBlock icon={Building2} title="No courts yet" message="Add a court students can book" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courts.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border p-5 space-y-3"
                      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-lg" style={{ color: 'var(--ch-text)' }}>{c.name}</h4>
                          {c.sport_name && <Badge variant="outline" className="mt-1 text-xs">{c.sport_name}</Badge>}
                        </div>
                        {!c.is_active && <Badge className="bg-gray-200 text-gray-700 text-[10px]">Inactive</Badge>}
                      </div>
                      <div className="text-sm space-y-1" style={{ color: 'var(--ch-muted)' }}>
                        {c.location && <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {c.location}</p>}
                        <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.opens_at.slice(0, 5)} – {c.closes_at.slice(0, 5)}</p>
                        {c.capacity && <p className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Capacity {c.capacity}</p>}
                        <p className="text-xs">{c.slot_minutes} min slots</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--ch-border)' }}>
                        <Button
                          size="sm" variant="outline" className="flex-1 gap-1"
                          onClick={() => setCourtDialog({ open: true, court: c })}
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleDeleteCourt(c.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--ch-text)' }}>
                <Calendar className="w-5 h-5 text-[#e05252]" />
                Court Bookings
              </h3>
              {bookings.length === 0 ? (
                <EmptyBlock icon={Calendar} title="No bookings yet" message="Student bookings will appear here" />
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => {
                    const statusInfo = {
                      Confirmed: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
                      Pending: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
                      Cancelled: { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
                      Completed: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
                    }[b.status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                    return (
                      <div
                        key={b.id}
                        className="rounded-xl border p-4 flex flex-wrap items-center gap-3"
                        style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                      >
                        <div className="flex-1 min-w-[240px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                              {b.student_name || 'Student'}
                            </h4>
                            {b.student_roll_number && <Badge variant="outline" className="text-[10px]">{b.student_roll_number}</Badge>}
                            {b.student_department && <Badge variant="outline" className="text-[10px]">{b.student_department}</Badge>}
                          </div>
                          <p className="text-sm mt-1" style={{ color: 'var(--ch-muted)' }}>
                            <strong>{b.court_name}</strong>{b.sport_name && ` · ${b.sport_name}`}
                          </p>
                          <div className="text-xs mt-1 flex flex-wrap gap-3" style={{ color: 'var(--ch-muted)' }}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(b.booking_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                            </span>
                            {b.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.location}</span>}
                          </div>
                          {b.purpose && <p className="text-xs mt-1 italic" style={{ color: 'var(--ch-muted)' }}>"{b.purpose}"</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className="border"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.color + '40' }}
                          >
                            {b.status}
                          </Badge>
                          {b.status === 'Confirmed' && (
                            <>
                              <Button
                                size="sm" onClick={() => handleBookingStatus(b.id, 'Completed')}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Mark Completed
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleBookingStatus(b.id, 'Cancelled')}
                                className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>

          {/* ACHIEVEMENTS TAB */}
          <TabsContent value="achievements" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setAchievementDialog(true)}
                className="gap-2 bg-[#e05252] hover:bg-[#c94545] text-white"
              >
                <Plus className="w-4 h-4" /> Award Achievement
              </Button>
            </div>
            {loadingData ? <LoadingBlock /> : achievements.length === 0 ? (
              <EmptyBlock icon={Medal} title="No achievements yet" message="Award students for their accomplishments" />
            ) : (
              <div className="space-y-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border p-4 flex items-center gap-4"
                    style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold" style={{ color: 'var(--ch-text)' }}>{a.title}</h4>
                        {a.position && <Badge className="bg-amber-100 text-amber-700 text-[10px]">{a.position}</Badge>}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>
                        {a.student_name} ({a.student_roll_number})
                        {a.sport_name && ` · ${a.sport_name}`}
                        {a.event_name && ` — ${a.event_name}`}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                        Awarded {new Date(a.awarded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => handleDeleteAchievement(a.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sport edit dialog */}
      <SportFormDialog
        open={sportDialog.open}
        sport={sportDialog.sport}
        onClose={() => setSportDialog({ open: false, sport: null })}
        onSaved={() => { setSportDialog({ open: false, sport: null }); fetchAll(); }}
      />

      {/* Event edit dialog */}
      <EventFormDialog
        open={eventDialog.open}
        sports={sports}
        event={eventDialog.event}
        onClose={() => setEventDialog({ open: false, event: null })}
        onSaved={() => { setEventDialog({ open: false, event: null }); fetchAll(); }}
      />

      {/* Results dialog */}
      <ResultsDialog
        event={resultsDialog}
        onClose={() => setResultsDialog(null)}
        onSaved={() => { setResultsDialog(null); fetchAll(); }}
      />

      {/* Team create dialog */}
      <TeamFormDialog
        open={teamDialog}
        sports={sports}
        onClose={() => setTeamDialog(false)}
        onSaved={() => { setTeamDialog(false); fetchAll(); }}
      />

      {/* Add member dialog */}
      <AddMemberDialog
        team={memberDialog}
        onClose={() => setMemberDialog(null)}
        onSaved={() => { setMemberDialog(null); fetchAll(); }}
      />

      {/* Court edit dialog */}
      <CourtFormDialog
        open={courtDialog.open}
        sports={sports}
        court={courtDialog.court}
        onClose={() => setCourtDialog({ open: false, court: null })}
        onSaved={() => { setCourtDialog({ open: false, court: null }); fetchAll(); }}
      />

      {/* Award achievement dialog */}
      <AchievementFormDialog
        open={achievementDialog}
        sports={sports}
        events={events}
        onClose={() => setAchievementDialog(false)}
        onSaved={() => { setAchievementDialog(false); fetchAll(); }}
      />
    </FacultyLayout>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-3"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--ch-text)' }}>{value}</p>
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

function SportFormDialog({
  open, sport, onClose, onSaved,
}: {
  open: boolean; sport: Sport | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SportCategory>('Cricket');
  const [coach, setCoach] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [schedule, setSchedule] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sport) {
      setName(sport.name);
      setCategory(sport.category);
      setCoach(sport.coach || '');
      setCoachEmail(sport.coach_email || '');
      setSchedule(sport.schedule || '');
      setVenue(sport.venue || '');
      setDescription(sport.description || '');
      setIsActive(sport.is_active);
    } else {
      setName(''); setCategory('Cricket'); setCoach(''); setCoachEmail('');
      setSchedule(''); setVenue(''); setDescription(''); setIsActive(true);
    }
  }, [sport, open]);

  const handleSave = async () => {
    if (!name.trim()) { alert('Name is required'); return; }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const body = {
        name, category, coach, coach_email: coachEmail, schedule, venue, description, is_active: isActive,
        ...(sport ? { id: sport.id } : {}),
      };
      const res = await fetch('/api/faculty/sports', {
        method: sport ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{sport ? 'Edit Sport' : 'Add New Sport'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Category *">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SportCategory)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              {SPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Coach"><Input value={coach} onChange={(e) => setCoach(e.target.value)} /></FormField>
            <FormField label="Coach Email"><Input value={coachEmail} onChange={(e) => setCoachEmail(e.target.value)} /></FormField>
          </div>
          <FormField label="Schedule"><Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Mon/Wed/Fri 5-7 PM" /></FormField>
          <FormField label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></FormField>
          {sport && (
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-text)' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventFormDialog({
  open, sports, event, onClose, onSaved,
}: {
  open: boolean; sports: Sport[]; event: AdminEvent | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setSportId(event.sport_id);
      setName(event.name);
      setDescription(event.description || '');
      setEventDate(event.event_date);
      setEventTime(event.event_time || '');
      setVenue(event.venue || '');
      setEligibility(event.eligibility || '');
      setDeadline(event.registration_deadline?.slice(0, 16) || '');
      setMaxParticipants(event.max_participants?.toString() || '');
      setStatus(event.status);
    } else {
      setSportId(sports[0]?.id || ''); setName(''); setDescription(''); setEventDate('');
      setEventTime(''); setVenue(''); setEligibility(''); setDeadline('');
      setMaxParticipants(''); setStatus('Upcoming');
    }
  }, [event, open, sports]);

  const handleSave = async () => {
    if (!sportId) { alert('Sport is required'); return; }
    if (!name.trim()) { alert('Name is required'); return; }
    if (!eventDate) { alert('Date is required'); return; }

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const body = {
        sport_id: sportId,
        name, description,
        event_date: eventDate,
        event_time: eventTime || null,
        venue, eligibility,
        registration_deadline: deadline || null,
        max_participants: maxParticipants ? Number(maxParticipants) : null,
        status,
        ...(event ? { id: event.id } : {}),
      };
      const res = await fetch('/api/faculty/sports/events', {
        method: event ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Sport *">
            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">Select sport</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Event Name *"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date *">
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </FormField>
            <FormField label="Time">
              <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></FormField>
          <FormField label="Eligibility"><Input value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="e.g. All undergraduate students" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Registration Deadline">
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </FormField>
            <FormField label="Max Participants">
              <Input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultsDialog({ event, onClose, onSaved }: { event: AdminEvent | null; onClose: () => void; onSaved: () => void }) {
  const [winner, setWinner] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [third, setThird] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('Completed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setWinner(event.winner || '');
      setRunnerUp(event.runner_up || '');
      setThird(event.third_place || '');
      setNotes(event.results_notes || '');
      setStatus(event.status);
    }
  }, [event]);

  if (!event) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/faculty/sports/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: event.id, winner, runner_up: runnerUp, third_place: third, results_notes: notes, status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Results</DialogTitle>
          <DialogDescription>{event.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Winner 🥇"><Input value={winner} onChange={(e) => setWinner(e.target.value)} /></FormField>
          <FormField label="Runner-up 🥈"><Input value={runnerUp} onChange={(e) => setRunnerUp(e.target.value)} /></FormField>
          <FormField label="Third Place 🥉"><Input value={third} onChange={(e) => setThird(e.target.value)} /></FormField>
          <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></FormField>
          <FormField label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Saving...' : 'Save Results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamFormDialog({
  open, sports, onClose, onSaved,
}: {
  open: boolean; sports: Sport[]; onClose: () => void; onSaved: () => void;
}) {
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [captain, setCaptain] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSportId(sports[0]?.id || ''); setName(''); setCaptain(''); setDescription('');
    }
  }, [open, sports]);

  const handleSave = async () => {
    if (!sportId || !name.trim()) { alert('Sport and name required'); return; }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/faculty/sports/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sport_id: sportId, name, captain_name: captain, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Sport *">
            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">Select sport</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Team Name *"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Captain Name"><Input value={captain} onChange={(e) => setCaptain(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ team, onClose, onSaved }: { team: AdminTeam | null; onClose: () => void; onSaved: () => void }) {
  const [rollNumber, setRollNumber] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) { setRollNumber(''); setPosition(''); }
  }, [team]);

  if (!team) return null;

  const handleAdd = async () => {
    if (!rollNumber.trim()) return;
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/faculty/sports/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team_id: team.id, student_roll_number: rollNumber, position }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to {team.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Student Roll Number *">
            <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 22R01A6601" />
          </FormField>
          <FormField label="Position / Role"><Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Captain, Bowler, Striker" /></FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AchievementFormDialog({
  open, sports, events, onClose, onSaved,
}: {
  open: boolean; sports: Sport[]; events: AdminEvent[];
  onClose: () => void; onSaved: () => void;
}) {
  const [rollNumber, setRollNumber] = useState('');
  const [title, setTitle] = useState('');
  const [position, setPosition] = useState<string>('Winner');
  const [sportId, setSportId] = useState('');
  const [eventId, setEventId] = useState('');
  const [description, setDescription] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRollNumber(''); setTitle(''); setPosition('Winner');
      setSportId(''); setEventId(''); setDescription(''); setCertUrl('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!rollNumber.trim() || !title.trim()) { alert('Roll number and title required'); return; }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/faculty/sports/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student_roll_number: rollNumber,
          title, position,
          sport_id: sportId || null,
          event_id: eventId || null,
          description, certificate_url: certUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Achievement</DialogTitle>
          <DialogDescription>Record a medal, certificate, or recognition</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Student Roll Number *">
            <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 22R01A6601" />
          </FormField>
          <FormField label="Title *">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Inter-College Cricket Championship" />
          </FormField>
          <FormField label="Position">
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              {ACHIEVEMENT_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sport">
              <select
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">None</option>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Event">
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              >
                <option value="">None</option>
                {events.filter((e) => !sportId || e.sport_id === sportId).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></FormField>
          <FormField label="Certificate URL"><Input value={certUrl} onChange={(e) => setCertUrl(e.target.value)} placeholder="https://..." /></FormField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Awarding...' : 'Award'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CourtFormDialog({
  open, sports, court, onClose, onSaved,
}: {
  open: boolean; sports: Sport[]; court: SportCourt | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [opensAt, setOpensAt] = useState('06:00');
  const [closesAt, setClosesAt] = useState('21:00');
  const [slotMinutes, setSlotMinutes] = useState('60');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (court) {
      setSportId(court.sport_id || '');
      setName(court.name);
      setLocation(court.location || '');
      setCapacity(court.capacity?.toString() || '');
      setDescription(court.description || '');
      setOpensAt(court.opens_at.slice(0, 5));
      setClosesAt(court.closes_at.slice(0, 5));
      setSlotMinutes(court.slot_minutes.toString());
      setIsActive(court.is_active);
    } else {
      setSportId(''); setName(''); setLocation(''); setCapacity('');
      setDescription(''); setOpensAt('06:00'); setClosesAt('21:00');
      setSlotMinutes('60'); setIsActive(true);
    }
  }, [court, open]);

  const handleSave = async () => {
    if (!name.trim()) { alert('Name required'); return; }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;
      const body = {
        sport_id: sportId || null,
        name, location, capacity, description,
        opens_at: opensAt, closes_at: closesAt, slot_minutes: slotMinutes,
        is_active: isActive,
        ...(court ? { id: court.id } : {}),
      };
      const res = await fetch('/api/faculty/sports/courts', {
        method: court ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{court ? 'Edit Court' : 'Add Court'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Sport">
            <select
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: 'var(--ch-bg)', borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
            >
              <option value="">None</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Court Name *"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} /></FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Opens"><Input type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} /></FormField>
            <FormField label="Closes"><Input type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} /></FormField>
            <FormField label="Slot (min)"><Input type="number" min="15" step="15" value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} /></FormField>
          </div>
          <FormField label="Capacity"><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></FormField>
          <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></FormField>
          {court && (
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ch-text)' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (students can book)
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#e05252] hover:bg-[#c94545] text-white">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ch-text)' }}>{label}</label>
      {children}
    </div>
  );
}
