import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-[var(--muted-foreground)]">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page Not Found</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button size="sm">Go to Dashboard</Button>
        </Link>
        <Link href="/accounts">
          <Button variant="outline" size="sm">View Accounts</Button>
        </Link>
      </div>
    </div>
  );
}
