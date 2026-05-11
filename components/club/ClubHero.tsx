'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, ChevronRight, Zap, Megaphone } from 'lucide-react';
import type { ClubInfo, ClubCounts } from '@/types/club';

interface ClubHeroProps {
  club: ClubInfo;
  counts: ClubCounts;
  onViewEvents?: () => void;
  onManageRecruitment?: () => void;
}

function isCIEClub(club: ClubInfo): boolean {
  return (
    club.name?.toLowerCase().includes('cie') ||
    club.contact_email?.toLowerCase().includes('cie') ||
    false
  );
}

export default function ClubHero({ club, counts, onViewEvents, onManageRecruitment }: ClubHeroProps) {
  const isCIE = isCIEClub(club);

  if (isCIE) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, var(--ch-card) 0%, var(--ch-sidebar) 100%)',
          borderColor: 'var(--ch-border)',
        }}
      >
        {/* Accent glow top-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(99,102,241,0.08) 0%, transparent 65%)',
          }}
        />
        {/* Accent glow bottom-right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at bottom right, rgba(99,102,241,0.05) 0%, transparent 60%)',
          }}
        />

        <div className="relative p-6 md:p-8 lg:p-10">
          {/* Top: logo + info */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 md:gap-8">

            {/* Large CIE logo block */}
            <div
              className="flex-shrink-0 self-start flex items-center justify-center rounded-2xl border-2 overflow-hidden p-4 bg-white"
              style={{
                width: '160px',
                height: '160px',
                borderColor: 'rgba(99,102,241,0.25)',
                boxShadow: '0 4px 24px rgba(99,102,241,0.12)',
              }}
            >
              <Image
                src="/clubs/cie-logo.png"
                alt="CIE Club Logo"
                width={132}
                height={132}
                className="object-contain w-full h-full"
                priority
              />
            </div>

            {/* Club info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                  style={{
                    backgroundColor: 'var(--ch-nav-active)',
                    color: 'var(--ch-accent)',
                    borderColor: 'transparent',
                  }}
                >
                  <Zap className="w-2.5 h-2.5 mr-1" />
                  Active Club
                </Badge>
              </div>

              <h1
                className="text-3xl md:text-4xl font-black tracking-tight leading-none"
                style={{ color: 'var(--ch-text)' }}
              >
                CIE Club
              </h1>
              <p
                className="text-sm font-bold mt-1"
                style={{ color: 'var(--ch-accent)' }}
              >
                Center for Innovation &amp; Entrepreneurship
              </p>

              {club.description && (
                <p
                  className="text-sm mt-3 leading-relaxed max-w-2xl"
                  style={{ color: 'var(--ch-muted)' }}
                >
                  {club.description}
                </p>
              )}

              {club.advisor_name && (
                <p className="text-xs mt-3" style={{ color: 'var(--ch-muted)' }}>
                  Faculty Advisor:{' '}
                  <span className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                    {club.advisor_name}
                  </span>
                </p>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2 mt-5">
                <Button
                  size="sm"
                  className="gap-1.5 font-bold"
                  style={{ backgroundColor: 'var(--ch-accent)', color: '#fff' }}
                  onClick={onManageRecruitment}
                >
                  Recruitment
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 font-bold border"
                  style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
                  onClick={onViewEvents}
                >
                  View Events
                </Button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="mt-7 pt-6 border-t grid grid-cols-3 sm:grid-cols-3 gap-4"
            style={{ borderColor: 'var(--ch-border)' }}
          >
            {[
              { label: 'Members', value: counts.members, icon: Users, color: '#6366f1' },
              { label: 'Events', value: counts.events, icon: CalendarDays, color: '#3b82f6' },
              { label: 'Announcements', value: counts.announcements, icon: Megaphone, color: '#10b981' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none" style={{ color: 'var(--ch-text)' }}>
                    {value}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-wider font-bold mt-0.5"
                    style={{ color: 'var(--ch-muted)' }}
                  >
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Non-CIE hero (compact, no image)
  return (
    <div
      className="relative rounded-2xl overflow-hidden border"
      style={{
        background: 'linear-gradient(135deg, var(--ch-card) 0%, var(--ch-sidebar) 100%)',
        borderColor: 'var(--ch-border)',
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, var(--ch-accent) 0%, transparent 70%)',
        }}
      />
      <div className="relative p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Text branding avatar */}
          <div
            className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl border flex items-center justify-center"
            style={{ backgroundColor: 'var(--ch-nav-active)', borderColor: 'var(--ch-border)' }}
          >
            <span
              className="text-3xl font-black tracking-tight"
              style={{ color: 'var(--ch-accent)' }}
            >
              {club.name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>

          {/* Club info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                style={{
                  backgroundColor: 'var(--ch-nav-active)',
                  color: 'var(--ch-accent)',
                  borderColor: 'transparent',
                }}
              >
                <Zap className="w-2.5 h-2.5 mr-1" />
                Active Club
              </Badge>
            </div>

            <h1
              className="text-2xl md:text-3xl font-black tracking-tight leading-tight"
              style={{ color: 'var(--ch-text)' }}
            >
              {club.name}
            </h1>

            {club.description && (
              <p className="text-sm mt-2 max-w-xl leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
                {club.description}
              </p>
            )}

            {club.advisor_name && (
              <p className="text-xs mt-2" style={{ color: 'var(--ch-muted)' }}>
                Faculty Advisor:{' '}
                <span className="font-semibold" style={{ color: 'var(--ch-text)' }}>
                  {club.advisor_name}
                </span>
              </p>
            )}

            <div className="flex flex-wrap gap-5 mt-5">
              {[
                { label: 'Members', value: counts.members, icon: Users },
                { label: 'Events', value: counts.events, icon: CalendarDays },
                { label: 'Announcements', value: counts.announcements, icon: Megaphone },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ch-accent)' }} />
                  <div>
                    <p className="text-lg font-black leading-none" style={{ color: 'var(--ch-text)' }}>
                      {value}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-wider font-bold mt-0.5"
                      style={{ color: 'var(--ch-muted)' }}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-row md:flex-col gap-2 flex-shrink-0 self-start">
            <Button
              size="sm"
              className="gap-1.5 font-bold"
              style={{ backgroundColor: 'var(--ch-accent)', color: '#fff' }}
              onClick={onManageRecruitment}
            >
              Recruitment
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 font-bold border"
              style={{ borderColor: 'var(--ch-border)', color: 'var(--ch-text)' }}
              onClick={onViewEvents}
            >
              View Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
