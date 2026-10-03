import { Skeleton } from '@/components/ui/skeleton';

/** A cold account read takes seconds: say what is loading instead of a blank page or the dashboard skeleton. */
export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28" aria-busy="true">
      <p role="status" className="text-sm text-[var(--muted-foreground)]">Loading the account (NEXT, WHO and WHY NOW)...</p>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-11 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
