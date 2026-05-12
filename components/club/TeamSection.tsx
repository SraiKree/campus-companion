'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/types/club';
import { MOCK_TEAM } from '@/lib/club-mock-data';

const ROLE_COLORS: Record<string, string> = {
  President: '#6366f1',
  'Vice President': '#8b5cf6',
  'Technical Lead': '#3b82f6',
  'Event Lead': '#f59e0b',
  'Media Lead': '#10b981',
  'Design Lead': '#ec4899',
  'Finance Lead': '#14b8a6',
};

interface TeamSectionProps {
  members?: TeamMember[];
}

export default function TeamSection({ members = MOCK_TEAM }: TeamSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ch-text)' }}>Core Team</h2>
        <span className="text-xs font-medium" style={{ color: 'var(--ch-muted)' }}>
          {members.length} members
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {members.map((member) => {
          const color = ROLE_COLORS[member.role] || 'var(--ch-accent)';
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={member.name}
              className="rounded-xl p-4 border text-center transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: 'var(--ch-card)',
                borderColor: 'var(--ch-border)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ch-border)';
              }}
            >
              <Avatar className="w-12 h-12 mx-auto mb-3">
                <AvatarFallback
                  className="text-white text-sm font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--ch-text)' }}>
                {member.name}
              </p>
              <Badge
                className="mt-1.5 text-[10px] font-bold px-2 py-0.5 border-0"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {member.role}
              </Badge>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--ch-muted)' }}>
                {member.department} · {member.year}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
