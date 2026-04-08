'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, AlertCircle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_role: string;
  user_id: string | null;
  is_read: boolean;
  created_at: string;
}

const PRIORITY_CONFIG = {
  low: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-200',
    label: 'Low',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-200',
    label: 'Medium',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-200',
    label: 'High',
  },
  urgent: {
    icon: Flame,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-200',
    label: 'Urgent',
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when panel opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const markAsRead = async (ids: string[]) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_ids: ids }),
      });

      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mark_all_read: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ color: 'var(--ch-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ch-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#e05252] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute top-12 right-0 w-[400px] rounded-2xl border shadow-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--ch-border)' }}
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ch-text)' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                  style={{ color: 'var(--ch-accent)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ch-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--ch-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ch-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            className="px-5 py-2 border-b flex gap-1"
            style={{ borderColor: 'var(--ch-border)' }}
          >
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg capitalize transition-colors"
                style={{
                  backgroundColor: filter === f ? 'var(--ch-accent-soft)' : 'transparent',
                  color: filter === f ? 'var(--ch-accent)' : 'var(--ch-muted)',
                }}
              >
                {f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#e05252] mx-auto mb-2" />
                <p className="text-xs" style={{ color: 'var(--ch-muted)' }}>Loading...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ch-border)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--ch-muted)' }}>
                  {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ch-muted)', opacity: 0.6 }}>
                  {filter === 'unread' ? 'You have no unread notifications' : 'Notifications will appear here'}
                </p>
              </div>
            ) : (
              <div>
                {displayed.map((n) => {
                  const config = PRIORITY_CONFIG[n.priority];
                  const PriorityIcon = config.icon;

                  return (
                    <div
                      key={n.id}
                      className="px-5 py-3.5 border-b transition-colors cursor-pointer"
                      style={{
                        borderColor: 'var(--ch-border)',
                        backgroundColor: n.is_read ? 'transparent' : 'var(--ch-accent-soft)',
                      }}
                      onMouseEnter={(e) => {
                        if (n.is_read) e.currentTarget.style.backgroundColor = 'var(--ch-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'var(--ch-accent-soft)';
                      }}
                      onClick={() => {
                        if (!n.is_read) markAsRead([n.id]);
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Priority Icon */}
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <PriorityIcon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm leading-snug ${n.is_read ? 'font-medium' : 'font-bold'}`}
                              style={{ color: 'var(--ch-text)' }}
                            >
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#e05252] shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p
                            className="text-xs mt-0.5 line-clamp-2 leading-relaxed"
                            style={{ color: 'var(--ch-muted)' }}
                          >
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color} uppercase`}
                            >
                              {config.label}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--ch-muted)', opacity: 0.7 }}>
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
