'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, Megaphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ANNOUNCEMENT_CLUBS, type AnnouncementRecord } from '@/lib/announcements';

import FacultyLayout from '@/components/layout/FacultyLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormState = {
  club_name: string;
  subject: string;
  description: string;
  link: string;
  image_url: string;
};

const EMPTY_FORM: FormState = {
  club_name: '',
  subject: '',
  description: '',
  link: '',
  image_url: '',
};

export default function FacultyAnnouncementsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'faculty')) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user, router]);

  const getToken = async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoadingList(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/faculty/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch announcements');
      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (err) {
      console.error('Error loading announcements:', err);
      toast.error((err as Error).message || 'Unable to load announcements');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'faculty') {
      fetchAnnouncements();
    }
  }, [loading, isAuthenticated, user, fetchAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.club_name) {
      toast.error('Pick a club');
      return;
    }
    if (!form.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/faculty/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create announcement');

      toast.success('Announcement posted');
      setForm(EMPTY_FORM);
      fetchAnnouncements();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/faculty/announcements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      toast.success('Announcement deleted');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !isAuthenticated || user?.role !== 'faculty') {
    return null;
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Announcements</h1>
          <p className="text-[#666]">Post announcements that students will see in their feed</p>
        </div>

        {/* Create form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-[#1a1a1a]">New Announcement</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="club_name">Club</Label>
              <Select
                value={form.club_name}
                onValueChange={(v) => setForm((f) => ({ ...f, club_name: v }))}
              >
                <SelectTrigger id="club_name" className="bg-white">
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_CLUBS.map((club) => (
                    <SelectItem key={club} value={club}>
                      {club}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Robotics workshop on Friday"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Details, agenda, what to bring, etc."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                type="url"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image_url">Image URL (optional)</Label>
              <Input
                id="image_url"
                type="url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#e05252] hover:bg-[#e05252]/90 text-white rounded-xl"
            >
              {submitting ? 'Posting…' : 'Post Announcement'}
            </Button>
          </div>
        </form>

        {/* List */}
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-3">My Announcements</h2>

          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e05252] mx-auto mb-3"></div>
                <p className="text-sm text-[#666]">Loading…</p>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
              <Megaphone className="w-12 h-12 text-[#666] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">No announcements yet</h3>
              <p className="text-sm text-[#666]">Post your first announcement using the form above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden"
                >
                  {a.image_url && (
                    <div className="aspect-[16/8] overflow-hidden bg-[#f2f0ed]">
                      <img
                        src={a.image_url}
                        alt={a.subject}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20 hover:bg-[#e05252]/10">
                        {a.club_name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === a.id}
                        onClick={() => handleDelete(a.id)}
                        className="text-[#666] hover:text-[#e05252] h-8 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="text-lg font-bold text-[#1a1a1a] leading-tight">{a.subject}</h3>
                    {a.description && (
                      <p className="text-sm text-[#666] leading-relaxed line-clamp-4">
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <CalendarDays className="w-4 h-4" />
                      <span>{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#e05252] hover:underline"
                      >
                        Open link <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FacultyLayout>
  );
}
