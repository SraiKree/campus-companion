'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, ImagePlus, Megaphone } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { ANNOUNCEMENT_CLUBS, type AnnouncementClub, type AnnouncementRecord } from '@/lib/announcements';
import { supabase } from '@/lib/supabase';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export default function FacultyAnnouncementsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<{
    subject: string;
    clubName: AnnouncementClub;
    description: string;
    link: string;
  }>({
    subject: '',
    clubName: ANNOUNCEMENT_CLUBS[0],
    description: '',
    link: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'faculty') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      fetchAnnouncements();
    }
  }, [loading, isAuthenticated, user]);

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/faculty/announcements', {
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
      console.error('Error fetching faculty announcements:', err);
      toast({
        title: 'Load failed',
        description: (err as Error).message || 'Unable to load announcements',
        variant: 'destructive',
      });
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      toast({ title: 'Missing subject', description: 'Please enter the event subject.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const payload = new FormData();
      payload.append('subject', form.subject.trim());
      payload.append('clubName', form.clubName);
      payload.append('description', form.description.trim());
      payload.append('link', form.link.trim());
      if (imageFile) {
        payload.append('image', imageFile);
      }

      const response = await fetch('/api/faculty/announcements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to post announcement');
      }

      setForm({
        subject: '',
        clubName: ANNOUNCEMENT_CLUBS[0],
        description: '',
        link: '',
      });
      setImageFile(null);
      toast({ title: 'Announcement posted', description: 'Students can now view this update in their module.' });
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
      toast({
        title: 'Post failed',
        description: (err as Error).message || 'Unable to save announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const withLinks = announcements.filter((item) => Boolean(item.link)).length;
    const withImages = announcements.filter((item) => Boolean(item.image_url)).length;

    return {
      total: announcements.length,
      withLinks,
      withImages,
    };
  }, [announcements]);

  if (loading || loadingAnnouncements) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading announcements...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'faculty') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        tabs={
          <div className="flex items-center gap-2">
            <Link href="/faculty">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Dashboard
              </Button>
            </Link>
            <Link href="/faculty/timetable">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Timetable
              </Button>
            </Link>
            <Link href="/faculty/attendance">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Attendance
              </Button>
            </Link>
            <Link href="/faculty/grades">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Grades
              </Button>
            </Link>
            <Link href="/faculty/assignments">
              <Button variant="ghost" className="rounded-full px-4 py-2 h-auto hover:bg-secondary text-foreground">
                Assignments
              </Button>
            </Link>
            <Button variant="ghost" className="rounded-full px-4 py-2 h-auto bg-[#141414] text-white hover:bg-[#141414]/90">
              Announcements
            </Button>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Post club events with an image, subject, description, and registration link for students.
            </p>
          </div>
          <div className="flex gap-3">
            <Card className="bg-muted p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Total posts</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">With poster</p>
                <p className="text-xl font-semibold">{stats.withImages}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">With link</p>
                <p className="text-xl font-semibold">{stats.withLinks}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6">
          <Card className="shadow-soft border-border rounded-2xl h-fit">
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Club Name</label>
                <select
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.clubName}
                  onChange={(e) => setForm((prev) => ({ ...prev, clubName: e.target.value as AnnouncementClub }))}
                >
                  {ANNOUNCEMENT_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  className="mt-2"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Hackathon registration open"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  className="mt-2"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add the event details, date, venue, and what students should know."
                  rows={5}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link</label>
                <Input
                  className="mt-2"
                  value={form.link}
                  onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com/register"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Event Image</label>
                <div className="mt-2 rounded-xl border border-dashed border-border p-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
                    <ImagePlus className="h-5 w-5" />
                    <span>{imageFile ? imageFile.name : 'Choose a poster or event image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden shadow-soft border-border rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">
                  {announcement.image_url ? (
                    <div className="h-full min-h-[180px] bg-secondary">
                      <img
                        src={announcement.image_url}
                        alt={announcement.subject}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center bg-secondary text-muted-foreground">
                      <Megaphone className="h-10 w-10" />
                    </div>
                  )}
                  <div>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{announcement.club_name}</Badge>
                        <Badge variant="outline">{announcement.faculty_name || user.name}</Badge>
                      </div>
                      <CardTitle>{announcement.subject}</CardTitle>
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
                        <Button asChild variant="outline" className="gap-2">
                          <a href={announcement.link} target="_blank" rel="noreferrer">
                            Open Link
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}

            {announcements.length === 0 ? (
              <Card className="shadow-soft border-border rounded-2xl">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No announcements posted yet. Create the first one from the form.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
