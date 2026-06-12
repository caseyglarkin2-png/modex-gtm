import { Button } from '@/components/ui/button';

// Prospect-safe 404: /for/* and /demo/* are proxied through yardflow.ai, so
// this page is public-facing. No internal nav (Dashboard / Accounts) and no
// internal product names here; route the visitor to the public site.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-[var(--muted-foreground)]">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page Not Found</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        This page doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <a href="https://yardflow.ai/">
          <Button size="sm">YardFlow Home</Button>
        </a>
        <a href="https://yardflow.ai/demo/">
          <Button variant="outline" size="sm">Live Network Demos</Button>
        </a>
      </div>
    </div>
  );
}
