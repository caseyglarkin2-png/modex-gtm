'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type GeneratedContentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GeneratedContentError({ error, reset }: GeneratedContentErrorProps) {
  useEffect(() => {
    // Keep this logged for production diagnostics.
    console.error('Generated content workspace error', error);
  }, [error]);

  return (
    <div className="space-y-4 rounded-md border border-red-200 bg-red-50/40 p-5">
      <h1 className="text-lg font-semibold">Generated content failed to load</h1>
      <p className="text-sm text-muted-foreground">
        We hit a loading error in this workspace. Retry the request, then check Ops if this continues.
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={reset}>Retry</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.assign('/ops?tab=proof-ledger')}
        >
          Open Ops
        </Button>
      </div>
    </div>
  );
}
