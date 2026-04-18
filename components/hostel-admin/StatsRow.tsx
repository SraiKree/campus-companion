'use client';

import { Users, UserMinus, BedDouble, Building2 } from 'lucide-react';

interface StatsRowProps {
  totalStudents: number;
  activeCount: number;
  leftCount: number;
  availableRooms: number;
}

export default function StatsRow({
  totalStudents,
  activeCount,
  leftCount,
  availableRooms,
}: StatsRowProps) {
  const stats = [
    { label: 'Total Students',     value: totalStudents,  icon: Users },
    { label: 'Active Hostellers',  value: activeCount,    icon: BedDouble },
    { label: 'Left Students',      value: leftCount,      icon: UserMinus },
    { label: 'Available Rooms',    value: availableRooms, icon: Building2 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-5 h-5 text-[#e05252]" />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--ch-muted)' }}
              >
                {s.label}
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--ch-text)' }}>
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
