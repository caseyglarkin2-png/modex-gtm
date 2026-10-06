import { Skeleton } from '@/components/ui/skeleton';

/** Work's cold read takes seconds: say what is loading at once (UX-14), never a blank page. */
export default function GapLoading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <p role="status" className="text-sm text-[var(--muted-foreground)]">Reading the accounts that need you (replies, follow ups, ready, decide, research)...</p>
      <Skeleton className="h-8 w-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }, (_, k) => (
          <Skeleton key={k} className="h-9 w-24" />
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
