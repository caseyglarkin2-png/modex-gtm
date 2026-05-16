import { Flame } from 'lucide-react';

/**
 * Marks an account with a live intent signal — an unread `hot_engagement`
 * notification raised within the last 24h. Lets a hot account be spotted
 * on a list without opening the notification bell.
 */
export function HotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
      <Flame className="h-3 w-3" />
      Hot
    </span>
  );
}
