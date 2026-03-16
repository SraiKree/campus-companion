'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, Megaphone } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ANNOUNCEMENT_CLUBS, type AnnouncementRecord } from '@/lib/announcements';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentAnnouncementsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('All');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'student') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'student') {
      fetchAnnouncements(selectedClub);
    }
  }, [loading, isAuthenticated, user, selectedClub]);

  const fetchAnnouncements = async (club: string) => {
    setLoadingAnnouncements(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const search = club !== 'All' ? `?club=${encodeURIComponent(club)}` : '';
      const response = await fetch(`/api/student/announcements${search}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch announcements');
      }

      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (err) {
      console.error('Error loading announcements:', err);
      setError((err as Error).message || 'Unable to load announcements');
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  if (loading || loadingAnnouncements) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading announcements...</p>
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
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Dashboard
              </Button>
            </Link>
            <Link href="/student/attendance">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
            </Link>
            <Link href="/student/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
            <Link href="/student/grades">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
              </Button>
            </Link>
            <Link href="/student/leave-request">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Leave Request
              </Button>
            </Link>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Announcements
            </Button>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Club Announcements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Faculty-posted events, updates, and registration links from campus clubs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedClub === 'All' ? 'default' : 'outline'}
              onClick={() => setSelectedClub('All')}
            >
              All Clubs
            </Button>
            {ANNOUNCEMENT_CLUBS.map((club) => (
              <Button
                key={club}
                size="sm"
                variant={selectedClub === club ? 'default' : 'outline'}
                onClick={() => setSelectedClub(club)}
              >
                {club}
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden shadow-soft border-border rounded-2xl">
              {announcement.image_url ? (
                <div className="aspect-[16/8] overflow-hidden bg-secondary">
                  <img
                    src={announcement.image_url}
                    alt={announcement.subject}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{announcement.club_name}</Badge>
                  <Badge variant="outline">{announcement.faculty_name || 'Faculty'}</Badge>
                </div>
                <CardTitle className="text-xl">{announcement.subject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {announcement.description || 'No description provided for this announcement.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(announcement.created_at).toLocaleString()}
                  </span>
                </div>
                {announcement.link ? (
                  <Button asChild className="gap-2">
                    <a href={announcement.link} target="_blank" rel="noreferrer">
                      Open Link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Megaphone className="h-4 w-4" />
                    Event details available in the description.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {announcements.length === 0 && !error ? (
          <Card className="shadow-soft border-border rounded-2xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements found for this club filter yet.
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
