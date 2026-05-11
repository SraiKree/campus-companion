'use client';

import { useRoleProtection } from '@/hooks/useRoleProtection';
import { useClubAnalytics } from '@/hooks/useClubAnalytics';
import ClubLayout from '@/components/layout/ClubLayout';
import AnalyticsCharts from '@/components/club/AnalyticsCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MOCK_ANALYTICS } from '@/lib/club-mock-data';
import {
  Users, CalendarDays, UserPlus, CheckCircle, Clock, BarChart2,
  UserCheck, Zap, AlertCircle,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  member_joined: UserCheck,
  event_created: CalendarDays,
  application_submitted: UserPlus,
  announcement_posted: BarChart2,
};

const ACTIVITY_COLORS: Record<string, string> = {
  member_joined: '#22c55e',
  event_created: '#6366f1',
  application_submitted: '#f59e0b',
  announcement_posted: '#3b82f6',
};


function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ClubAnalyticsPage() {
  const { loading, authorized } = useRoleProtection('club');
  const { data: realData, loading: dataLoading, error } = useClubAnalytics();

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const analytics = realData ?? MOCK_ANALYTICS;
  const { overview, recentActivity } = analytics;

  const overviewCards = [
    { label: 'Total Members', value: overview.totalMembers, icon: Users, color: '#6366f1' },
    { label: 'Active Events', value: overview.activeEvents, icon: Zap, color: '#22c55e' },
    { label: 'Total Events', value: overview.totalEvents, icon: CalendarDays, color: '#3b82f6' },
    { label: 'Applications', value: overview.totalApplications, icon: UserPlus, color: '#f59e0b' },
    { label: 'Pending', value: overview.pendingApplications, icon: Clock, color: '#f59e0b' },
    { label: 'Accepted', value: overview.acceptedApplications, icon: CheckCircle, color: '#22c55e' },
  ];

  return (
    <ClubLayout>
      <div className="max-w-5xl space-y-7">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ch-muted)' }}>
            Club performance metrics and insights
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error} — showing sample data
          </div>
        )}

        {/* Overview Cards */}
        {dataLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {overviewCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl p-4 border"
                style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-2xl font-black" style={{ color: 'var(--ch-text)' }}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--ch-muted)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {dataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <AnalyticsCharts data={analytics} />
        )}

        {/* Activity Feed */}
        <div
          className="rounded-xl border"
          style={{ backgroundColor: 'var(--ch-card)', borderColor: 'var(--ch-border)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--ch-border)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--ch-text)' }}>Recent Activity</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--ch-border)' }}>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--ch-muted)' }}>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] || BarChart2;
                const color = ACTIVITY_COLORS[activity.type] || '#6366f1';
                return (
                  <div key={activity.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <p className="flex-1 text-sm" style={{ color: 'var(--ch-text)' }}>
                      {activity.message}
                    </p>
                    <p className="text-xs flex-shrink-0" style={{ color: 'var(--ch-muted)' }}>
                      {timeAgo(activity.time)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </ClubLayout>
  );
}
