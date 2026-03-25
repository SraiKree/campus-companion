'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, Megaphone, Pin } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ANNOUNCEMENT_CLUBS, type AnnouncementRecord } from '@/lib/announcements';

import StudentLayout from '@/components/layout/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e05252] mx-auto mb-4"></div>
            <p className="text-[#666]">Loading announcements...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  // Separate pinned and regular announcements
  const pinnedAnnouncements = announcements.filter(a => a.id.includes('pinned')).slice(0, 2);
  const regularAnnouncements = announcements.filter(a => !a.id.includes('pinned'));

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Announcements</h1>
            <p className="text-[#666]">Stay updated with campus events and club activities</p>
          </div>
        </div>

        {/* Club Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedClub('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedClub === 'All'
                ? 'bg-[#e05252] text-white shadow-md'
                : 'bg-white text-[#666] border border-[#e5e5e5] hover:border-[#e05252] hover:text-[#e05252]'
            }`}
          >
            All Clubs
          </button>
          {ANNOUNCEMENT_CLUBS.map((club) => (
            <button
              key={club}
              onClick={() => setSelectedClub(club)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedClub === club
                  ? 'bg-[#e05252] text-white shadow-md'
                  : 'bg-white text-[#666] border border-[#e5e5e5] hover:border-[#e05252] hover:text-[#e05252]'
              }`}
            >
              {club}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-[#e05252]/20 bg-[#e05252]/5 p-6">
            <p className="text-sm text-[#e05252]">{error}</p>
          </div>
        )}

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-[#e05252]" />
              <h2 className="text-lg font-bold text-[#1a1a1a]">Pinned</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pinnedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-2xl border-2 border-[#e05252] overflow-hidden shadow-lg"
                >
                  {announcement.image_url && (
                    <div className="aspect-[16/8] overflow-hidden bg-[#f2f0ed]">
                      <img
                        src={announcement.image_url}
                        alt={announcement.subject}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20 hover:bg-[#e05252]/10">
                        {announcement.club_name}
                      </Badge>
                      <Badge className="bg-[#f2f0ed] text-[#666] border-[#e5e5e5] hover:bg-[#f2f0ed]">
                        {announcement.faculty_name || 'Faculty'}
                      </Badge>
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1a1a] leading-tight">
                      {announcement.subject}
                    </h3>
                    <p className="text-sm text-[#666] leading-relaxed">
                      {announcement.description || 'No description provided for this announcement.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <CalendarDays className="w-4 h-4" />
                      <span>{new Date(announcement.created_at).toLocaleString()}</span>
                    </div>
                    {announcement.link ? (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#e05252] hover:bg-[#e05252]/90 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Open Link
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm text-[#666]">
                        <Megaphone className="w-4 h-4" />
                        Event details in description
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        {regularAnnouncements.length > 0 && (
          <div className="space-y-4">
            {pinnedAnnouncements.length > 0 && (
              <h2 className="text-lg font-bold text-[#1a1a1a]">All Announcements</h2>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {regularAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden hover:border-[#e05252] transition-all"
                >
                  {announcement.image_url && (
                    <div className="aspect-[16/8] overflow-hidden bg-[#f2f0ed]">
                      <img
                        src={announcement.image_url}
                        alt={announcement.subject}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/10">
                        {announcement.club_name}
                      </Badge>
                      <Badge className="bg-[#f2f0ed] text-[#666] border-[#e5e5e5] hover:bg-[#f2f0ed]">
                        {announcement.faculty_name || 'Faculty'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1a1a] leading-tight">
                      {announcement.subject}
                    </h3>
                    <p className="text-sm text-[#666] leading-relaxed line-clamp-3">
                      {announcement.description || 'No description provided for this announcement.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <CalendarDays className="w-4 h-4" />
                      <span>{new Date(announcement.created_at).toLocaleString()}</span>
                    </div>
                    {announcement.link ? (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#e05252] hover:bg-[#e05252]/90 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Open Link
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm text-[#666]">
                        <Megaphone className="w-4 h-4" />
                        Event details in description
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {announcements.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 text-center">
            <Megaphone className="w-16 h-16 text-[#666] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No Announcements</h3>
            <p className="text-[#666]">
              {selectedClub === 'All'
                ? 'No announcements available at the moment'
                : `No announcements found for ${selectedClub}`}
            </p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
