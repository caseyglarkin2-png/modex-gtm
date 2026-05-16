'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '@/lib/data';

interface Notification {
  id: number;
  type: string;
  account_name: string | null;
  persona_email: string | null;
  subject: string | null;
  preview: string | null;
  read: boolean;
  created_at: string;
}

const POLL_INTERVAL_MS = 15_000;
/** Notification types worth interrupting the operator with a toast. */
const TOAST_TYPES = new Set(['hot_engagement', 'reply']);

export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const hasLoadedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) return;
      const data = await res.json();
      const next: Notification[] = data.notifications ?? [];

      // Toast genuinely new, unread, high-signal notifications — but never
      // on the first load, which would fire a burst for the existing backlog.
      if (hasLoadedRef.current) {
        for (const n of next) {
          if (n.read || seenIdsRef.current.has(n.id) || !TOAST_TYPES.has(n.type)) continue;
          const label = n.type === 'hot_engagement' ? '🔥 Hot lead' : 'New reply';
          toast(n.account_name ? `${label} — ${n.account_name}` : label, {
            description: n.subject ?? n.preview ?? undefined,
          });
        }
      }
      seenIdsRef.current = new Set(next.map((n) => n.id));
      hasLoadedRef.current = true;

      setNotifications(next);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently fail — non-critical UI element
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mirror the unread count into the tab title so a backgrounded tab still
  // signals waiting intent.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  const markRead = async (ids: number[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead([notification.id]);
    }
    // Navigate to account if available
    if (notification.account_name) {
      window.location.href = `/accounts/${slugify(notification.account_name)}`;
    }
    setOpen(false);
  };

  const typeLabel: Record<string, string> = {
    reply: 'Reply',
    open: 'Opened',
    click: 'Clicked',
    bounce: 'Bounced',
    meeting_booked: 'Meeting',
    hot_engagement: 'Hot Lead',
  };

  const typeBadgeColor: Record<string, string> = {
    reply: 'bg-green-100 text-green-800',
    open: 'bg-blue-100 text-blue-800',
    click: 'bg-purple-100 text-purple-800',
    bounce: 'bg-red-100 text-red-800',
    meeting_booked: 'bg-yellow-100 text-yellow-800',
    hot_engagement: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown — anchored left in narrow rails so it opens into the page */}
          <div
            className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} z-50 mt-2 w-80 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
                    if (unreadIds.length > 0) markRead(unreadIds);
                  }}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full border-b border-[var(--border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--muted)] ${
                      !n.read ? 'bg-[var(--accent)]/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          typeBadgeColor[n.type] || 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        }`}
                      >
                        {typeLabel[n.type] || n.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {n.persona_email || n.account_name || 'Unknown'}
                        </p>
                        {n.subject && (
                          <p className="truncate text-xs text-[var(--muted-foreground)]">{n.subject}</p>
                        )}
                        {n.preview && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                            {n.preview}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--primary)]" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
