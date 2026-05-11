'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import ClubLayout from '@/components/layout/ClubLayout';
import ClubHero from '@/components/club/ClubHero';
import TeamSection from '@/components/club/TeamSection';
import ClubAchievements from '@/components/club/ClubAchievements';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MOCK_CLUB, MOCK_COUNTS, MOCK_EVENTS, MOCK_ANNOUNCEMENTS, MOCK_GALLERY,
} from '@/lib/club-mock-data';
import {
  CalendarDays, Megaphone, Globe, Instagram, Linkedin, Twitter,
  MapPin, Clock, Users, AlertCircle, Camera, Video, Image as ImageIcon,
} from 'lucide-react';
import type { ClubInfo, ClubCounts, ClubEvent, ClubAnnouncement, GalleryItem } from '@/types/club';

interface DashboardData {
  club: ClubInfo;
  counts: ClubCounts;
  events: ClubEvent[];
  announcements: ClubAnnouncement[];
}

const EVENT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Upcoming: { bg: '#6366f120', color: '#6366f1' },
  Ongoing: { bg: '#22c55e20', color: '#22c55e' },
  Completed: { bg: '#71717a20', color: '#71717a' },
  Cancelled: { bg: '#ef444420', color: '#ef4444' },
};

const DUMMY_SOCIAL = [
  { label: 'Instagram', icon: Instagram, href: '#', color: '#e1306c' },
  { label: 'LinkedIn', icon: Linkedin, href: '#', color: '#0077b5' },
  { label: 'Twitter', icon: Twitter, href: '#', color: '#1da1f2' },
  { label: 'Website', icon: Globe, href: '#', color: '#6366f1' },
];

const GALLERY_TYPE_ICON = {
  photo: Camera,
  video: Video,
};

function GalleryCard({ item }: { item: GalleryItem }) {
  const Icon = GALLERY_TYPE_ICON[item.type] || ImageIcon;
  return (
    <div
      className="rounded-xl overflow-hidden border group cursor-pointer"
      style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
    >
      {/* Visual placeholder */}
      <div
        className="h-32 flex flex-col items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${item.color}30 0%, ${item.color}15 100%)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${item.color}25` }}
        >
          <Icon className="w-6 h-6" style={{ color: item.color }} />
        </div>
        <span
          className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${item.color}25`, color: item.color }}
        >
          {item.type}
        </span>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold leading-tight" style={{ color: 'var(--ch-text)' }}>
          {item.title}
        </p>
        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--ch-muted)' }}>
          {item.caption}
        </p>
        <p className="text-[9px] mt-1.5 font-medium" style={{ color: 'var(--ch-muted)' }}>
          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

export default function ClubDashboardPage() {
  const { loading, authorized } = useRoleProtection('club');
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? '';
        const headers = { Authorization: `Bearer ${token}` };

        const [meRes, eventsRes, annRes] = await Promise.all([
          fetch('/api/club/me', { headers }),
          fetch('/api/club/events', { headers }),
          fetch('/api/club/announcements', { headers }),
        ]);

        const [meBody, eventsBody, annBody] = await Promise.all([
          meRes.json(), eventsRes.json(), annRes.json(),
        ]);

        if (!meRes.ok) throw new Error(meBody.error || 'Failed to load club data');

        const rawEvents: ClubEvent[] = eventsBody.events?.slice(0, 4) || [];
        const rawAnn: ClubAnnouncement[] = annBody.announcements?.slice(0, 4) || [];

        setData({
          club: meBody.club,
          counts: meBody.counts,
          events: rawEvents.length > 0 ? rawEvents : MOCK_EVENTS.slice(0, 4),
          announcements: rawAnn.length > 0 ? rawAnn : MOCK_ANNOUNCEMENTS.slice(0, 4),
        });
      } catch {
        // API unavailable — use full mock set
        setData({
          club: MOCK_CLUB,
          counts: MOCK_COUNTS,
          events: MOCK_EVENTS.slice(0, 4),
          announcements: MOCK_ANNOUNCEMENTS.slice(0, 4),
        });
        setError(null);
      } finally {
        setFetching(false);
      }
    })();
  }, [authorized]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (fetching) {
    return (
      <ClubLayout>
        <div className="max-w-5xl space-y-5">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </ClubLayout>
    );
  }

  if (error) {
    return (
      <ClubLayout>
        <div
          className="flex items-center gap-3 rounded-xl border p-4 text-sm"
          style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      </ClubLayout>
    );
  }

  const { club, counts, events, announcements } = data!;

  return (
    <ClubLayout>
      <div className="max-w-5xl space-y-7">

        {/* HERO — CIE gets large logo banner, others get compact */}
        <ClubHero
          club={club}
          counts={counts}
          onViewEvents={() => router.push('/club/events')}
          onManageRecruitment={() => router.push('/club/recruitment')}
        />

        {/* ABOUT */}
        <div
          className="rounded-xl p-6 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--ch-text)' }}>About</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
            {club.description ||
              `${club.name} is a student-run organization dedicated to fostering innovation, collaboration, and growth among students. We host workshops, competitions, and networking events throughout the academic year. Our mission is to bridge the gap between classroom learning and real-world application.`}
          </p>
          {club.advisor_name && (
            <div
              className="mt-4 pt-4 border-t flex items-center gap-2 text-sm"
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-muted)' }}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              Faculty Advisor:{' '}
              <span className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                {club.advisor_name}
              </span>
            </div>
          )}
        </div>

        {/* EVENTS + ANNOUNCEMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Upcoming Events */}
          <div
            className="rounded-xl border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--ch-border)' }}
            >
              <h2 className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>Upcoming Events</h2>
              <button
                onClick={() => router.push('/club/events')}
                className="text-xs font-semibold"
                style={{ color: 'var(--ch-accent)' }}
              >
                View all →
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--ch-border)' }}>
              {events.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ch-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No upcoming events</p>
                </div>
              ) : (
                events.map((ev) => {
                  const style = EVENT_STATUS_STYLES[ev.status] || EVENT_STATUS_STYLES.Upcoming;
                  return (
                    <div key={ev.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ch-text)' }}>
                            {ev.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--ch-muted)' }}>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            {ev.event_time && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {ev.event_time}
                              </span>
                            )}
                            {ev.venue && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ev.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          className="text-[10px] font-bold flex-shrink-0 border-0 px-2"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {ev.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div
            className="rounded-xl border"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--ch-border)' }}
            >
              <h2 className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>Announcements</h2>
              <button
                onClick={() => router.push('/club/announcements')}
                className="text-xs font-semibold"
                style={{ color: 'var(--ch-accent)' }}
              >
                View all →
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--ch-border)' }}>
              {announcements.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ch-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No announcements yet</p>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="px-5 py-4">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ch-text)' }}>
                      {ann.title}
                    </p>
                    {ann.body && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--ch-muted)' }}>
                        {ann.body}
                      </p>
                    )}
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--ch-muted)' }}>
                      {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CORE TEAM */}
        <div
          className="rounded-xl p-6 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <TeamSection />
        </div>

        {/* ACHIEVEMENTS */}
        <div
          className="rounded-xl p-6 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <ClubAchievements />
        </div>

        {/* GALLERY */}
        <div
          className="rounded-xl p-6 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>Gallery</h2>
            <span className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>
              {MOCK_GALLERY.length} items
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOCK_GALLERY.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* SOCIAL LINKS */}
        <div
          className="rounded-xl p-6 border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ch-text)' }}>Connect With Us</h2>
          <div className="flex flex-wrap gap-3">
            {DUMMY_SOCIAL.map(({ label, icon: Icon, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-150 hover:shadow-sm"
                style={{
                  backgroundColor: `${color}10`,
                  borderColor: `${color}30`,
                  color,
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </ClubLayout>
  );
}
