'use client';

import { Trophy, Star, Award, Zap, Globe, BookOpen } from 'lucide-react';
import type { ClubAchievement } from '@/types/club';
import { MOCK_ACHIEVEMENTS } from '@/lib/club-mock-data';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  zap: Zap,
  globe: Globe,
  book: BookOpen,
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

interface ClubAchievementsProps {
  achievements?: ClubAchievement[];
}

export default function ClubAchievements({ achievements = MOCK_ACHIEVEMENTS }: ClubAchievementsProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ch-text)' }}>Achievements</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((achievement, idx) => {
          const color = COLORS[idx % COLORS.length];
          const Icon = ICON_MAP[achievement.icon] || Trophy;
          return (
            <div
              key={achievement.title}
              className="flex items-start gap-4 rounded-xl p-4 border"
              style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>
                    {achievement.title}
                  </p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {achievement.year}
                  </span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
                  {achievement.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
