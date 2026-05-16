'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLastSeen } from '@/lib/use-last-seen';
import { formatRelativeTime } from '@/lib/engagement-center';

export type RecencyItem = {
  id: string;
  title: string;
  accountName: string | null;
  statusLabel: string;
  kind: string;
  occurredAt: string;
  href: string | null;
};

/**
 * Home cockpit "Since your last visit" feed — the answer to "what changed
 * overnight?". Flags items newer than the operator's previous visit and
 * folds in this week's booked-meeting count.
 */
export function HomeRecencyFeed({
  items,
  meetingsThisWeek,
}: {
  items: RecencyItem[];
  meetingsThisWeek: number;
}) {
  const lastSeen = useLastSeen('home:lastSeenAt');
  const newCount =
    lastSeen == null
      ? 0
      : items.filter((item) => new Date(item.occurredAt).getTime() > lastSeen).length;

  const summary = [
    lastSeen == null
      ? `${items.length} recent ${items.length === 1 ? 'signal' : 'signals'}`
      : newCount > 0
        ? `${newCount} new since your last visit`
        : 'Nothing new since your last visit',
    meetingsThisWeek > 0
      ? `${meetingsThisWeek} meeting${meetingsThisWeek === 1 ? '' : 's'} booked this week`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Since your last visit</CardTitle>
          <Link
            href="/engagement"
            className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Open Engagement →
          </Link>
        </div>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{summary}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            No engagement yet — replies, opens, and microsite reads land here.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.slice(0, 8).map((item) => {
              const isNew =
                lastSeen != null && new Date(item.occurredAt).getTime() > lastSeen;
              const row = (
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-medium">{item.accountName ?? 'Unknown account'}</span>
                      <span className="text-[var(--muted-foreground)]"> — {item.statusLabel}</span>
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">{item.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isNew ? (
                      <Badge variant="default" className="h-5 px-1.5 text-[10px]">new</Badge>
                    ) : null}
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{item.kind}</Badge>
                    <span className="w-14 text-right text-xs tabular-nums text-[var(--muted-foreground)]">
                      {formatRelativeTime(new Date(item.occurredAt))}
                    </span>
                  </div>
                </div>
              );
              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block transition-colors hover:bg-[var(--accent)]/40"
                >
                  {row}
                </Link>
              ) : (
                <div key={item.id}>{row}</div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
