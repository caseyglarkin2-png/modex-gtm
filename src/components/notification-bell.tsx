'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';

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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently fail — non-critical UI element
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
      const slug = notification.account_name.toLowerCase().replace(/\s+/g, '-');
      window.location.href = `/accounts/${slug}`;
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
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
                    if (unreadIds.length > 0) markRead(unreadIds);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                      !n.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          typeBadgeColor[n.type] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {typeLabel[n.type] || n.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {n.persona_email || n.account_name || 'Unknown'}
                        </p>
                        {n.subject && (
                          <p className="truncate text-xs text-gray-600">{n.subject}</p>
                        )}
                        {n.preview && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                            {n.preview}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
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
